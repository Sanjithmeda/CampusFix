import React from 'react';
import { AlertTriangle, Droplets, Info } from 'lucide-react';
import { WaterIssueType } from '../../types';
import { getWaterIssueLabel } from '../../utils/prioritization';

interface WaterSafetyBadgeProps {
  suspectedContamination?: boolean;
  waterIssueType?: WaterIssueType;
  showDisclaimer?: boolean;
}

export const WaterSafetyBadge: React.FC<WaterSafetyBadgeProps> = ({
  suspectedContamination,
  waterIssueType,
  showDisclaimer = false
}) => {
  if (!suspectedContamination && (!waterIssueType || waterIssueType === 'none')) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {suspectedContamination ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-600 text-white shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            SUSPECTED WATER CONTAMINATION
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            Water Quality Issue
          </span>
        )}

        {waterIssueType && waterIssueType !== 'none' && (
          <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80">
            {getWaterIssueLabel(waterIssueType)}
          </span>
        )}
      </div>

      {showDisclaimer && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] text-amber-900">
            <strong className="font-semibold">Statutory Water Safety Notice:</strong> This software platform does not independently test or certify chemical, biological, or potable water safety. Reports of suspected contamination trigger an urgent high-priority flag for emergency human laboratory testing.
          </p>
        </div>
      )}
    </div>
  );
};
