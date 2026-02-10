import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, Plus, MoreVertical, Edit2, Copy, Trash2 } from "lucide-react";

const Roles = () => {
  // Predefined system role
  const systemRole = {
    id: "system_dp",
    name: "Dealer Principal",
    description: "Unrestricted access to all modules",
    facility: "All Facilities",
    isSystem: true,
  };

  // Sample demo roles
  const demoRoles = [
    {
      id: "role_001",
      name: "Service Manager",
      description: "Service operations access",
      facility: "Aftersales",
      isSystem: false,
    },
    {
      id: "role_002",
      name: "Receptionist",
      description: "Appointment & customer handling",
      facility: "Aftersales",
      isSystem: false,
    },
    {
      id: "role_003",
      name: "CRE",
      description: "Customer relations tasks",
      facility: "Aftersales",
      isSystem: false,
    },
    {
      id: "role_004",
      name: "Parts Manager",
      description: "Parts & inventory access",
      facility: "Aftersales",
      isSystem: false,
    },
  ];

  const allRoles = [systemRole, ...demoRoles];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center">
            <Shield className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tighter uppercase">
              Roles
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage user roles and access</p>
          </div>
        </div>

        <Button
          className="bg-black text-white hover:bg-gray-800 rounded-sm font-mono text-xs uppercase tracking-wider"
          disabled
        >
          <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
          New Role
        </Button>
      </div>

      {/* Roles Table */}
      <Card className="border border-gray-200 rounded-sm shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="table-header bg-gray-50">
              <TableHead className="text-xs">Role Name</TableHead>
              <TableHead className="text-xs">Description</TableHead>
              <TableHead className="text-xs">Facility</TableHead>
              <TableHead className="text-xs w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRoles.map((role) => (
              <TableRow key={role.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{role.name}</span>
                    {role.isSystem && (
                      <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                        System Role
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{role.description}</span>
                </TableCell>
                <TableCell>
                  {role.isSystem ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-sm"
                        >
                          <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Copy className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          Clone
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Roles;
