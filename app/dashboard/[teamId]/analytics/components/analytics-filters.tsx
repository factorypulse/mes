"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, X } from "lucide-react";

export interface FilterState {
  dateRange: string;
  departments: string[];
  operators: string[];
  customStartDate?: Date;
  customEndDate?: Date;
}

interface AnalyticsFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableDepartments?: Array<{ id: string; name: string }>;
  availableOperators?: Array<{ id: string; name: string }>;
  showOperatorFilter?: boolean;
}

const dateRangeOptions = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "thisWeek", label: "This week" },
  { value: "lastWeek", label: "Last week" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "custom", label: "Custom range" }
];

export function AnalyticsFilters({
  filters,
  onFiltersChange,
  availableDepartments = [],
  availableOperators = [],
  showOperatorFilter = false
}: AnalyticsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDateRangeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: value
    });
  };

  const handleDepartmentToggle = (departmentId: string) => {
    const newDepartments = filters.departments.includes(departmentId)
      ? filters.departments.filter(id => id !== departmentId)
      : [...filters.departments, departmentId];
    
    onFiltersChange({
      ...filters,
      departments: newDepartments
    });
  };

  const handleOperatorToggle = (operatorId: string) => {
    const newOperators = filters.operators.includes(operatorId)
      ? filters.operators.filter(id => id !== operatorId)
      : [...filters.operators, operatorId];
    
    onFiltersChange({
      ...filters,
      operators: newOperators
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: "last7days",
      departments: [],
      operators: []
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange !== "last7days") count++;
    if (filters.departments.length > 0) count++;
    if (filters.operators.length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {(isExpanded || activeFilterCount > 0) && (
        <CardContent className="space-y-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </label>
            <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          {availableDepartments.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Departments</label>
              <div className="flex flex-wrap gap-2">
                {availableDepartments.map((dept) => (
                  <Badge
                    key={dept.id}
                    variant={filters.departments.includes(dept.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => handleDepartmentToggle(dept.id)}
                  >
                    {dept.name}
                    {filters.departments.includes(dept.id) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              {filters.departments.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  All departments included
                </p>
              )}
            </div>
          )}

          {/* Operator Filter */}
          {showOperatorFilter && availableOperators.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Operators</label>
              <div className="flex flex-wrap gap-2">
                {availableOperators.map((operator) => (
                  <Badge
                    key={operator.id}
                    variant={filters.operators.includes(operator.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => handleOperatorToggle(operator.id)}
                  >
                    {operator.name}
                    {filters.operators.includes(operator.id) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              {filters.operators.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  All operators included
                </p>
              )}
            </div>
          )}

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Active filters:</span>
                {filters.dateRange !== "last7days" && (
                  <Badge variant="outline" className="text-xs">
                    {dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}
                  </Badge>
                )}
                {filters.departments.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {filters.departments.length} departments
                  </Badge>
                )}
                {filters.operators.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {filters.operators.length} operators
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}