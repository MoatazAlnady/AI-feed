import React from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SingleSelectCombobox } from '@/components/ui/multi-select-combobox';

interface Employee {
  id: string;
  name: string;
  photo?: string;
  role?: string;
}

interface AssigneeSelectorProps {
  employees: Employee[];
  selectedId: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  employees,
  selectedId,
  onChange,
  placeholder = "Assign to team member (optional)",
  className = ""
}) => {
  const options = employees.map(employee => ({
    value: employee.id,
    label: employee.name,
    icon: (
      <Avatar className="h-5 w-5">
        <AvatarImage src={employee.photo || ''} />
        <AvatarFallback className="text-xs">
          {employee.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )
  }));

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
        <User className="h-4 w-4" />
        Assign To
      </label>
      <SingleSelectCombobox
        options={options}
        value={selectedId}
        onChange={onChange}
        placeholder={placeholder}
        searchPlaceholder="Search team members..."
        emptyMessage="No team members found."
      />
      {selectedId && (
        <p className="text-xs text-muted-foreground mt-1">
          This task will be assigned to the selected team member.
        </p>
      )}
    </div>
  );
};

export default AssigneeSelector;
