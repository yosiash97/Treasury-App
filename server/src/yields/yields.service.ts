import { Injectable, BadRequestException, ServiceUnavailableException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { YieldsQueryDto } from './dto/yields.dto';
import { XMLParser } from 'fast-xml-parser';
import { YieldsResult, YieldRow } from './yields.types';

@Injectable()
export class YieldsService {
  constructor(
    private readonly http: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private readonly endpoint =
    'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml';

    private readonly parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
      // remove any namespace prefix (e.g., "m:", "d:")
      transformTagName: (tag) => tag.replace(/^.*:/, ''),
      // normalize: always make "entry" an array
      isArray: (tagName) => tagName === 'entry',
    });
    
    async getYields({ year, month }: YieldsQueryDto): Promise<YieldsResult> {
      if (!year) throw new BadRequestException('Query must include a valid year.');
    
      const cacheKey = `treasury:yields:${year}:${month || 'all'}`;
      
      // Check cache first
      const cached = await this.cacheManager.get<YieldsResult>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const xml = await this.fetchXml(year);
      const entries = this.parseEntries(xml);
      
      if (entries.length > 0) {
        const firstEntry = entries[0];
        const p = firstEntry?.content?.properties;
        const firstDate = p?.INDEX_DATE ?? p?.QUOTE_DATE;
      }
      
      const filtered = month ? this.filterByMonth(entries, month) : entries;
      
      const rows = this.mapToDomain(filtered);
    
      const result = { year, month, rows };
      
      // Cache the result
      const currentDate = new Date();
      const isCurrentMonth = month && 
        currentDate.getFullYear() === year && 
        currentDate.getMonth() + 1 === month;
      
      // Set different TTL based on whether it's current month data
      const ttl = isCurrentMonth 
        ? 60 * 60 * 1000  // 1 hour for current month
        : 24 * 60 * 60 * 1000; // 24 hours for historical data
      
      await this.cacheManager.set(cacheKey, result, ttl);
      
      return result;
    }
  

  private async fetchXml(year: number): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<string>(this.endpoint, {
          params: {
            data: 'daily_treasury_bill_rates',
            field_tdr_date_value: String(year),
          },
          headers: {
            Accept: 'application/xml,text/xml',
            'User-Agent': 'treasury-yields-service/1.0',
          },
          responseType: 'text' as const, // keep raw XML as string
        }),
      );
      return data;
    } catch (e) {
      throw new ServiceUnavailableException('Treasury API unavailable');
    }
  }

  private parseEntries(xml: string): any[] {
    const parsed = this.parser.parse(xml);
    return parsed?.feed?.entry ?? [];
  }
  
  private filterByMonth(entries: any[], month: number): any[] {
    let debugCount = 0; // Use a counter for debugging instead
    
    const filtered = entries.filter((e) => {
      const p = e?.content?.properties;
      const idxRaw = p?.INDEX_DATE ?? p?.QUOTE_DATE;
      if (!idxRaw) return false;
      
      // Extract actual date string from XML object
      const idx = typeof idxRaw === 'string' ? idxRaw : idxRaw['#text'];
      if (!idx) return false;
      
      const d = new Date(idx);
      const result = d.getMonth() + 1 === month;
      
      if (debugCount < 5) { // Log first few for debugging
        debugCount++;
      }
      
      return result;
    });
    
    return filtered;
  }
  
  private mapToDomain(entries: any[]): YieldRow[] {
    const results = entries
      .map((e, index) => {
        const p = e?.content?.properties ?? {};
        const idxRaw = p.INDEX_DATE ?? p.QUOTE_DATE;
        
        if (!idxRaw) {
          return null;
        }
  
        const idx = typeof idxRaw === 'string' ? idxRaw : idxRaw['#text'];
        
        if (!idx) {
          return null;
        }
  
        let date: Date;
        try {
          date = new Date(idx);
          if (isNaN(date.getTime())) {
            return null;
          }
        } catch (error) {
          return null;
        }
  
        const num = (v: unknown) => {
          let val = v;
          if (typeof v === 'object' && v !== null && '#text' in v) {
            val = v['#text'];
          }
          const n = typeof val === 'string' ? Number(val.replace('%', '').trim()) : Number(val);
          return Number.isFinite(n) ? n : undefined;
        };
  
        try {
          return {
            date: date.toISOString().slice(0, 10),
            wk4:  num(p.ROUND_B1_YIELD_4WK_2),
            wk6:  num(p.ROUND_B1_YIELD_6WK_2),
            wk8:  num(p.ROUND_B1_YIELD_8WK_2),
            wk13: num(p.ROUND_B1_YIELD_13WK_2),
            wk17: num(p.ROUND_B1_YIELD_17WK_2),
            wk26: num(p.ROUND_B1_YIELD_26WK_2),
            wk52: num(p.ROUND_B1_YIELD_52WK_2),
          } as YieldRow;
        } catch (error) {
          return null;
        }
      })
      .filter((r): r is YieldRow => r !== null)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  
    return results;
  }
  
}
