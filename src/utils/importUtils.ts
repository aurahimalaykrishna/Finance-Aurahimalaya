import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parse, isValid, format } from 'date-fns';

export interface ColumnMapping {
  date: string | null;
  amount: string | null;
  description: string | null;
  type: string | null;
  category: string | null;
}

export interface ParsedRow {
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
  isValid: boolean;
  errors: string[];
  originalRow: Record<string, unknown>;
}

export interface ParseResult {
  headers: string[];
  rows: Record<string, unknown>[];
  suggestedMapping: ColumnMapping;
}

const DATE_COLUMN_PATTERNS = [
  /^date$/i,
  /^transaction.?date$/i,
  /^posted.?date$/i,
  /^trans.?date$/i,
  /^booking.?date$/i,
  /^value.?date$/i,
];

const AMOUNT_COLUMN_PATTERNS = [
  /^amount$/i,
  /^value$/i,
  /^sum$/i,
  /^total$/i,
  /^debit$/i,
  /^credit$/i,
  /^withdrawal$/i,
  /^deposit$/i,
];

const DESCRIPTION_COLUMN_PATTERNS = [
  /^description$/i,
  /^memo$/i,
  /^payee$/i,
  /^merchant$/i,
  /^narrative$/i,
  /^details$/i,
  /^reference$/i,
  /^particulars$/i,
];

const TYPE_COLUMN_PATTERNS = [
  /^type$/i,
  /^trans.?type$/i,
  /^transaction.?type$/i,
  /^category$/i,
];

function matchColumn(headers: string[], patterns: RegExp[]): string | null {
  for (const header of headers) {
    for (const pattern of patterns) {
      if (pattern.test(header.trim())) {
        return header;
      }
    }
  }
  return null;
}

export function detectColumnMappings(headers: string[]): ColumnMapping {
  return {
    date: matchColumn(headers, DATE_COLUMN_PATTERNS),
    amount: matchColumn(headers, AMOUNT_COLUMN_PATTERNS),
    description: matchColumn(headers, DESCRIPTION_COLUMN_PATTERNS),
    type: matchColumn(headers, TYPE_COLUMN_PATTERNS),
    category: null,
  };
}

export function detectFileType(file: File): 'csv' | 'excel' | 'unknown' {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'csv';
  if (['xlsx', 'xls'].includes(extension || '')) return 'excel';
  return 'unknown';
}

export async function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, unknown>[];
        resolve({
          headers,
          rows,
          suggestedMapping: detectColumnMappings(headers),
        });
      },
      error: (error) => reject(error),
    });
  });
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];
        
        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [], suggestedMapping: { date: null, amount: null, description: null, type: null, category: null } });
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => String(h || ''));
        const rows = jsonData.slice(1).map(row => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = (row as unknown[])[index];
          });
          return obj;
        });

        resolve({
          headers,
          rows,
          suggestedMapping: detectColumnMappings(headers),
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseFile(file: File): Promise<ParseResult> {
  const fileType = detectFileType(file);
  if (fileType === 'csv') return parseCSVFile(file);
  if (fileType === 'excel') return parseExcelFile(file);
  return Promise.reject(new Error('Unsupported file type'));
}

const DATE_FORMATS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'dd/MM/yyyy',
  'MM-dd-yyyy',
  'dd-MM-yyyy',
  'yyyy/MM/dd',
  'M/d/yyyy',
  'd/M/yyyy',
  'MMM dd, yyyy',
  'dd MMM yyyy',
];

export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  
  const strValue = String(value).trim();
  
  // Try Excel serial date number
  if (!isNaN(Number(strValue)) && Number(strValue) > 25000 && Number(strValue) < 50000) {
    const excelDate = new Date((Number(strValue) - 25569) * 86400 * 1000);
    if (isValid(excelDate)) return excelDate;
  }

  // Try ISO format first
  const isoDate = new Date(strValue);
  if (isValid(isoDate) && !isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try each format
  for (const fmt of DATE_FORMATS) {
    try {
      const parsed = parse(strValue, fmt, new Date());
      if (isValid(parsed)) return parsed;
    } catch {
      continue;
    }
  }

  return null;
}

export function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  let strValue = String(value).trim();
  
  // Handle parentheses as negative
  const isNegative = strValue.startsWith('(') && strValue.endsWith(')');
  if (isNegative) {
    strValue = strValue.slice(1, -1);
  }
  
  // Remove currency symbols and whitespace
  strValue = strValue.replace(/[$€£¥₹,\s]/g, '');
  
  // Handle negative sign
  const hasNegativeSign = strValue.startsWith('-');
  if (hasNegativeSign) {
    strValue = strValue.slice(1);
  }
  
  const num = parseFloat(strValue);
  if (isNaN(num)) return null;
  
  return (isNegative || hasNegativeSign) ? -Math.abs(num) : num;
}

export function determineTransactionType(
  amount: number,
  typeValue?: unknown
): 'income' | 'expense' {
  // If type column is provided, try to parse it
  if (typeValue) {
    const typeStr = String(typeValue).toLowerCase().trim();
    if (['income', 'credit', 'deposit', 'in', 'cr'].some(t => typeStr.includes(t))) {
      return 'income';
    }
    if (['expense', 'debit', 'withdrawal', 'out', 'dr', 'payment'].some(t => typeStr.includes(t))) {
      return 'expense';
    }
  }
  
  // Fall back to amount sign
  return amount >= 0 ? 'income' : 'expense';
}

export function validateAndParseRow(
  row: Record<string, unknown>,
  mapping: ColumnMapping,
  existingCategories: Array<{ id: string; name: string; type: string; parent_id?: string | null }>
): ParsedRow {
  const errors: string[] = [];
  
  // Parse date
  const dateValue = mapping.date ? row[mapping.date] : null;
  const parsedDate = parseDate(dateValue);
  if (!parsedDate) {
    errors.push('Invalid or missing date');
  } else if (parsedDate > new Date()) {
    errors.push('Date cannot be in the future');
  }
  
  // Parse amount
  const amountValue = mapping.amount ? row[mapping.amount] : null;
  let parsedAmount = parseAmount(amountValue);
  if (parsedAmount === null) {
    errors.push('Invalid or missing amount');
    parsedAmount = 0;
  }
  
  // Determine type
  const typeValue = mapping.type ? row[mapping.type] : null;
  const type = determineTransactionType(parsedAmount, typeValue);
  
  // Make amount positive for storage
  const absoluteAmount = Math.abs(parsedAmount);
  
  // Parse description
  const description = mapping.description 
    ? String(row[mapping.description] || '').trim() 
    : '';
  
  // Try to match category (support hierarchical matching)
  let matchedCategory: string | undefined;
  if (mapping.category && row[mapping.category]) {
    const categoryValue = String(row[mapping.category]).toLowerCase().trim();
    
    // First, try exact match
    let match = existingCategories.find(
      c => c.name.toLowerCase() === categoryValue && c.type === type
    );
    
    // If no match, try matching "Parent > Sub" format
    if (!match && categoryValue.includes('>')) {
      const parts = categoryValue.split('>').map(p => p.trim());
      if (parts.length === 2) {
        const [parentName, subName] = parts;
        const parent = existingCategories.find(
          c => c.name.toLowerCase() === parentName && c.type === type && !c.parent_id
        );
        if (parent) {
          match = existingCategories.find(
            c => c.name.toLowerCase() === subName && c.type === type && c.parent_id === parent.id
          );
        }
      }
    }
    
    // If still no match, try fuzzy matching on sub-category name only
    if (!match) {
      match = existingCategories.find(
        c => c.name.toLowerCase().includes(categoryValue) && c.type === type
      );
    }
    
    if (match) {
      matchedCategory = match.id;
    }
  }
  
  return {
    date: parsedDate ? format(parsedDate, 'yyyy-MM-dd') : '',
    amount: absoluteAmount,
    description,
    type,
    category: matchedCategory,
    isValid: errors.length === 0,
    errors,
    originalRow: row,
  };
}

export function validateRows(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping,
  existingCategories: Array<{ id: string; name: string; type: string; parent_id?: string | null }>
): ParsedRow[] {
  return rows.map(row => validateAndParseRow(row, mapping, existingCategories));
}
