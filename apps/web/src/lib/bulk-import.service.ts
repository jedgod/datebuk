/**
 * Bulk Staff Import Service
 * Handles importing staff from CSV with optional photos
 */

export interface BulkImportRow {
  name: string;
  email: string;
  department?: string;
  jobTitle?: string;
  role?: string;
  photoFile?: File;
}

export interface BulkImportResult {
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  staffCreated: any[];
}

interface ImportedStaff {
  id: string;
  email: string;
  staffProfile: {
    displayName: string;
    jobTitle: string;
    department: string;
  };
  accountStatus: string;
  role: string;
  lastLoginAt?: string;
  photoUrl?: string;
  photoData?: string;
}

/**
 * Parses CSV file
 */
export async function parseCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV must have header row and at least one data row'));
          return;
        }

        // Parse header
        const headers = lines[0]
          .split(',')
          .map(h => h.trim().toLowerCase());

        // Parse data rows
        const rows: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          if (row.email) {
            rows.push(row);
          }
        }

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
}

/**
 * Validates bulk import data
 */
export function validateBulkImportRow(
  row: Record<string, string>,
  rowIndex: number
): { isValid: boolean; error?: string } {
  // Check required fields
  if (!row.name || !row.name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  if (!row.email || !row.email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(row.email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Process bulk import
 */
export async function processBulkImport(
  csvFile: File,
  photoFiles?: File[]
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    successful: 0,
    failed: 0,
    errors: [],
    staffCreated: [],
  };

  try {
    // Parse CSV
    const rows = await parseCSV(csvFile);

    // Create a map of photos by email
    const photoMap: Record<string, File> = {};
    if (photoFiles) {
      photoFiles.forEach(file => {
        // Expected format: email.jpg (e.g., john@example.com.jpg)
        const emailMatch = file.name.match(/^(.+?)\.(jpg|jpeg|png|webp)$/i);
        if (emailMatch) {
          const email = emailMatch[1].replace(/_/g, '@');
          photoMap[email] = file;
        }
      });
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = validateBulkImportRow(row, i + 2); // +2 for header + 1-based indexing

      if (!validation.isValid) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          email: row.email,
          error: validation.error || 'Unknown error',
        });
        continue;
      }

      try {
        // Create staff object
        const staff: ImportedStaff = {
          id: `staff_${Date.now()}_${i}`,
          email: row.email.toLowerCase(),
          staffProfile: {
            displayName: row.name,
            jobTitle: row['job title'] || row.jobtitle || 'Staff Member',
            department: row.department || 'General',
          },
          accountStatus: 'PENDING',
          role: (row.role || 'VIEWER').toUpperCase(),
          lastLoginAt: undefined,
          photoUrl: undefined,
          photoData: undefined,
        };

        // Try to find and attach photo
        const photoFile = photoMap[row.email.toLowerCase()];
        if (photoFile) {
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = () => {
              staff.photoUrl = reader.result as string;
              staff.photoData = reader.result as string;
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(photoFile);
          });
        }

        result.staffCreated.push(staff);
        result.successful++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          email: row.email,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return result;
  } catch (err) {
    throw new Error(
      `Failed to process CSV: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * Formats bulk import results for display
 */
export function formatBulkImportResults(result: BulkImportResult): string {
  let summary = `✅ Bulk Import Complete!\n\n`;
  summary += `Successfully Created: ${result.successful}\n`;
  summary += `Failed: ${result.failed}\n`;

  if (result.errors.length > 0) {
    summary += `\n⚠️ Errors:\n`;
    result.errors.forEach(err => {
      summary += `  Row ${err.row} (${err.email}): ${err.error}\n`;
    });
  }

  return summary;
}
