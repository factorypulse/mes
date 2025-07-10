"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export interface ExportButtonProps {
  teamId: string;
  exportType: "dashboard" | "performance" | "wip";
  departments?: { id: string; name: string }[];
  className?: string;
}

export function ExportButton({
  teamId,
  exportType,
  departments = [],
  className,
}: ExportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [dateRange, setDateRange] = useState("last30days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const { toast } = useToast();

  const handleExport = async (quickFormat?: "csv" | "json") => {
    if (quickFormat) {
      await performExport(quickFormat, { dateRange: "last30days" });
      return;
    }

    setIsDialogOpen(true);
  };

  const performExport = async (exportFormat: "csv" | "json", options?: any) => {
    setIsExporting(true);

    try {
      const exportOptions = options || {
        format: exportFormat,
        dateRange: dateRange === "custom" ? undefined : dateRange,
        customStartDate: dateRange === "custom" ? customStartDate : undefined,
        customEndDate: dateRange === "custom" ? customEndDate : undefined,
        departments:
          selectedDepartments.length > 0 ? selectedDepartments : undefined,
      };

      const response = await fetch("/api/analytics/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId,
          exportType,
          options: exportOptions,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Handle file download
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `${exportType}_export_${
            new Date().toISOString().split("T")[0]
          }.${exportFormat}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Data exported as ${exportFormat.toUpperCase()}`,
      });

      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDepartmentToggle = (departmentId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(departmentId)
        ? prev.filter((id) => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Quick Export</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("json")}>
            <FileText className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport()}>
            Advanced Export...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>
              Configure your export options and download the data.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="format" className="text-right">
                Format
              </Label>
              <Select
                value={format}
                onValueChange={(value: "csv" | "json") => setFormat(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateRange" className="text-right">
                Date Range
              </Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 days</SelectItem>
                  <SelectItem value="last30days">Last 30 days</SelectItem>
                  <SelectItem value="last90days">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </>
            )}

            {departments.length > 0 && (
              <div className="grid gap-2">
                <Label>Departments (optional)</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {departments.map((department) => (
                    <div
                      key={department.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={department.id}
                        checked={selectedDepartments.includes(department.id)}
                        onCheckedChange={() =>
                          handleDepartmentToggle(department.id)
                        }
                      />
                      <Label htmlFor={department.id} className="text-sm">
                        {department.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => performExport(format)}
              disabled={isExporting}
            >
              {isExporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
