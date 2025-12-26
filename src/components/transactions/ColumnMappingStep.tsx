import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ColumnMapping } from '@/utils/importUtils';

interface ColumnMappingStepProps {
  headers: string[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  sampleRows: Record<string, unknown>[];
}

const MAPPING_FIELDS = [
  { key: 'date' as const, label: 'Date', required: true, description: 'Transaction date' },
  { key: 'amount' as const, label: 'Amount', required: true, description: 'Transaction amount' },
  { key: 'description' as const, label: 'Description', required: false, description: 'Transaction description/memo' },
  { key: 'type' as const, label: 'Type', required: false, description: 'Income or expense indicator' },
  { key: 'category' as const, label: 'Category', required: false, description: 'Category name to match' },
];

export function ColumnMappingStep({
  headers,
  mapping,
  onMappingChange,
  sampleRows,
}: ColumnMappingStepProps) {
  const handleChange = (field: keyof ColumnMapping, value: string) => {
    onMappingChange({
      ...mapping,
      [field]: value === '_none_' ? null : value,
    });
  };

  const getSampleValue = (header: string | null): string => {
    if (!header || sampleRows.length === 0) return '-';
    const value = sampleRows[0][header];
    if (value === null || value === undefined) return '-';
    return String(value).slice(0, 30);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        We've auto-detected some columns. Please verify and adjust the mappings as needed.
      </p>

      <div className="grid gap-4">
        {MAPPING_FIELDS.map(({ key, label, required, description }) => (
          <div
            key={key}
            className="grid grid-cols-[1fr,2fr,1fr] gap-4 items-center p-3 rounded-lg bg-muted/50"
          >
            <div>
              <Label className="flex items-center gap-2">
                {label}
                {required && <Badge variant="outline" className="text-xs">Required</Badge>}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>

            <Select
              value={mapping[key] || '_none_'}
              onValueChange={(value) => handleChange(key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">
                  <span className="text-muted-foreground">-- Not mapped --</span>
                </SelectItem>
                {headers.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground truncate">
              Sample: <span className="font-mono">{getSampleValue(mapping[key])}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Preview of first few rows */}
      {sampleRows.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">File Preview (first 3 rows)</h4>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row, i) => (
                  <tr key={i} className="border-t">
                    {headers.map((header) => (
                      <td key={header} className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate">
                        {String(row[header] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
