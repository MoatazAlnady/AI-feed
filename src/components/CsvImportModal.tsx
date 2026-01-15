import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, FileSpreadsheet, Send, CheckCircle2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { generateCSVTemplate } from '@/utils/csvTemplate';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCsvSelect: (file: File, data: any[]) => void;
  onSubmit: () => void;
  csvFile: File | null;
  csvData: any[];
  csvError: string;
  isProcessing: boolean;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onCsvSelect,
  onSubmit,
  csvFile,
  csvData,
  csvError,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDownloadTemplate = () => {
    const csvContent = generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-tools-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (file: File) => {
    if (file && file.type === 'text/csv') {
      try {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, '').trim());
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
            });
            return obj;
          });
        
        onCsvSelect(file, data);
      } catch (error) {
        onCsvSelect(file, []);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const exampleTools = [
    {
      name: 'ChatGPT',
      category: 'Conversational AI',
      description: 'Advanced conversational AI for various tasks including writing, coding, and analysis.',
      pricing: 'Freemium',
    },
    {
      name: 'Midjourney',
      category: 'Image Generation',
      description: 'Create stunning AI-generated artwork and images from text descriptions.',
      pricing: 'Paid',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {t('submitTool.bulkImport', 'Bulk Import AI Tools')}
          </DialogTitle>
          <DialogDescription>
            {t('submitTool.bulkImportDescription', 'Download the template or upload your completed CSV file to add multiple tools at once.')}
          </DialogDescription>
        </DialogHeader>

        {/* Two Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Download Template Card */}
          <div className="border border-border rounded-xl p-6 text-center bg-card hover:bg-accent/5 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {t('submitTool.downloadTemplate', 'Download Template')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('submitTool.downloadTemplateDesc', 'Get the CSV template with example data and proper formatting')}
            </p>
            <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {t('submitTool.downloadCSV', 'Download CSV')}
            </Button>
          </div>

          {/* Upload CSV Card */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : csvFile
                ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                : 'border-border hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
            
            {csvFile ? (
              <>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{csvFile.name}</h3>
                <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                  ✓ {csvData.length} {t('submitTool.toolsFound', 'tools found')}
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  {t('submitTool.chooseAnother', 'Choose another file')}
                </Button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t('submitTool.uploadCSV', 'Upload CSV File')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('submitTool.dragDrop', 'Drag & drop or click to browse')}
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('submitTool.chooseFile', 'Choose File')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {csvError && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm">
            {csvError}
          </div>
        )}

        {/* Example Preview Table */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">
              {t('submitTool.exampleToolsPreview', 'Example Tools in Template:')}
            </h4>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">{t('common.name', 'Tool Name')}</TableHead>
                  <TableHead className="font-semibold">{t('common.category', 'Category')}</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">{t('common.description', 'Description')}</TableHead>
                  <TableHead className="font-semibold">{t('common.pricing', 'Pricing')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exampleTools.map((tool, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{tool.name}</TableCell>
                    <TableCell>{tool.category}</TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell max-w-[200px] truncate">
                      {tool.description}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tool.pricing === 'Freemium' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {tool.pricing}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* CSV Format Guide Accordion */}
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="format-guide" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              {t('submitTool.csvFormatGuide', 'CSV Format Guide')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pb-2">
                <div>
                  <h5 className="font-medium text-foreground mb-2">{t('submitTool.requiredColumns', 'Required Columns:')}</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Category</li>
                    <li>• Subcategory Name (must match existing subcategory)</li>
                    <li>• Tool Name</li>
                    <li>• Link</li>
                    <li>• Tool Description</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-foreground mb-2">{t('submitTool.optionalColumns', 'Optional Columns:')}</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Pricing</li>
                    <li>• Pros (separate with semicolons)</li>
                    <li>• Cons (separate with semicolons)</li>
                    <li>• Tags (separate with commas)</li>
                    <li>• Features (separate with semicolons)</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary">
                  <strong>{t('common.tip', 'Tip')}:</strong> {t('submitTool.formatTip', 'Use semicolons (;) to separate multiple pros/cons/features, and commas (,) to separate tags.')}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Submit Button */}
        {csvFile && csvData.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              onClick={onSubmit}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('submitTool.processing', 'Processing...')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('submitTool.submitTools', 'Submit {{count}} Tools', { count: csvData.length })}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CsvImportModal;
