import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { detectBarcodeFormat, validateEan13 } from '../../utils/barcode';

interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'auto';
  width?: number; // bar width in px
  height?: number; // bar height in px
  displayValue?: boolean;
  fontSize?: number;
  fontFamily?: string;
  fontOptions?: string;
  textMargin?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'auto',
  width = 1.6,
  height = 50,
  displayValue = true,
  fontSize = 12,
  fontFamily = 'monospace',
  fontOptions = '',
  textMargin = 2,
  margin = 4,
  background = 'transparent',
  lineColor = '#000000',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) {
      setError(value ? null : 'No barcode value provided');
      return;
    }

    try {
      let resolvedFormat = format;
      if (resolvedFormat === 'auto') {
        resolvedFormat = detectBarcodeFormat(value);
      }

      // If EAN13 is requested or detected, check length
      if (resolvedFormat === 'EAN13') {
        const eanVal = validateEan13(value);
        if (!eanVal.valid) {
          // Fallback to Code 128 to ensure it always renders rather than throwing
          resolvedFormat = 'CODE128';
        }
      }

      JsBarcode(svgRef.current, value, {
        format: resolvedFormat,
        width,
        height,
        displayValue,
        text: value,
        fontSize,
        font: fontFamily,
        fontOptions,
        textMargin,
        margin,
        background,
        lineColor,
        valid: (valid) => {
          if (!valid) {
            setError('Invalid barcode data');
          } else {
            setError(null);
          }
        },
      });
      setError(null);
    } catch (err: any) {
      console.warn('Barcode rendering error:', err);
      // Fallback to CODE128 if specific format failed
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, value, {
            format: 'CODE128',
            width,
            height,
            displayValue,
            text: value,
            fontSize,
            font: fontFamily,
            margin,
            background,
            lineColor,
          });
          setError(null);
        }
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'Failed to render barcode');
      }
    }
  }, [value, format, width, height, displayValue, fontSize, fontFamily, fontOptions, textMargin, margin, background, lineColor]);

  if (!value) {
    return (
      <div className={`flex items-center justify-center p-2 text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded ${className}`}>
        No Barcode
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
      {error && (
        <span className="text-[10px] text-amber-600 font-mono mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
};
