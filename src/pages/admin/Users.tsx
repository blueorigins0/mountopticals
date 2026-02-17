 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
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
 import {
   Users,
   Plus,
   Search,
   MoreHorizontal,
   Building2,
   Store,
   Mail,
   Phone,
   Shield,
   ShieldCheck,
   ShieldOff,
  Loader2,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 interface UserWithRole {
   id: string;
   user_id: string;
   email: string;
   full_name: string | null;
   company_name: string | null;
   phone: string | null;
   is_active: boolean;
   created_at: string;
   role: "shop" | "retail" | null;
 }
 
 export default function AdminUsers() {
  const navigate = useNavigate();
   const [users, setUsers] = useState<UserWithRole[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState("");
   const [roleFilter, setRoleFilter] = useState<string>("all");
   const { toast } = useToast();
 
   const fetchUsers = async () => {
     setIsLoading(true);
     try {
       // Fetch profiles
       const { data: profiles, error: profilesError } = await supabase
         .from("profiles")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (profilesError) throw profilesError;
 
       // Fetch roles for all users
       const { data: roles, error: rolesError } = await supabase
         .from("user_roles")
         .select("user_id, role")
         .in("role", ["shop", "retail"]);
 
       if (rolesError) throw rolesError;
 
       // Merge profiles with roles
       const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
         const userRole = roles?.find((r) => r.user_id === profile.user_id);
         return {
           ...profile,
           role: (userRole?.role as "shop" | "retail") || null,
         };
       });
 
       setUsers(usersWithRoles);
     } catch (error) {
       console.error("Error fetching users:", error);
       toast({
         title: "Error",
         description: "Failed to load users",
         variant: "destructive",
       });
     }
     setIsLoading(false);
   };
 
   useEffect(() => {
     fetchUsers();
   }, []);
 
   const handleUpdateRole = async (userId: string, newRole: "shop" | "retail") => {
     try {
       // Delete existing shop/retail role
       await supabase
         .from("user_roles")
         .delete()
         .eq("user_id", userId)
         .in("role", ["shop", "retail"]);
 
       // Insert new role
       const { error } = await supabase.from("user_roles").insert({
         user_id: userId,
         role: newRole,
       });
 
       if (error) throw error;
 
       toast({
         title: "Role Updated",
         description: `User role changed to ${newRole}`,
       });
       fetchUsers();
     } catch (error) {
       console.error("Error updating role:", error);
       toast({
         title: "Error",
         description: "Failed to update user role",
         variant: "destructive",
       });
     }
   };
 
   const handleToggleActive = async (userId: string, currentActive: boolean) => {
     try {
       const { error } = await supabase
         .from("profiles")
         .update({ is_active: !currentActive })
         .eq("user_id", userId);
 
       if (error) throw error;
 
       toast({
         title: currentActive ? "User Deactivated" : "User Activated",
         description: `User has been ${currentActive ? "deactivated" : "activated"}.`,
       });
       fetchUsers();
     } catch (error) {
       console.error("Error toggling user status:", error);
       toast({
         title: "Error",
         description: "Failed to update user status",
         variant: "destructive",
       });
     }
   };
 
   const filteredUsers = users.filter((user) => {
     const matchesSearch =
       user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
       user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       user.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
 
     const matchesRole =
       roleFilter === "all" ||
       (roleFilter === "unassigned" && !user.role) ||
       user.role === roleFilter;
 
     return matchesSearch && matchesRole;
   });
 
   return (
     <div className="space-y-6">
       {/* Page Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
             User Management
           </h1>
           <p className="text-muted-foreground">
             Create and manage Shop and Retail buyer accounts
           </p>
         </div>
        <Button 
          onClick={() => navigate("/admin/users/new")}
          className="bg-gradient-accent gap-2"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
       </div>
 
       {/* Stats */}
       <div className="grid sm:grid-cols-3 gap-4">
         <Card className="shadow-card">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-xl bg-shop-light flex items-center justify-center">
                 <Building2 className="h-6 w-6 text-shop" />
               </div>
               <div>
                 <p className="text-2xl font-bold text-foreground">
                   {users.filter((u) => u.role === "shop").length}
                 </p>
                 <p className="text-sm text-muted-foreground">Shop Buyers</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card className="shadow-card">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-xl bg-retail-light flex items-center justify-center">
                 <Store className="h-6 w-6 text-retail" />
               </div>
               <div>
                 <p className="text-2xl font-bold text-foreground">
                   {users.filter((u) => u.role === "retail").length}
                 </p>
                 <p className="text-sm text-muted-foreground">Retail Buyers</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card className="shadow-card">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                 <Users className="h-6 w-6 text-warning" />
               </div>
               <div>
                 <p className="text-2xl font-bold text-foreground">
                   {users.filter((u) => !u.role).length}
                 </p>
                 <p className="text-sm text-muted-foreground">Pending Assignment</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Filters */}
       <Card className="shadow-card">
         <CardContent className="pt-6">
           <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="Search by email, name, or company..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-10"
               />
             </div>
             <Select value={roleFilter} onValueChange={setRoleFilter}>
               <SelectTrigger className="w-48">
                 <SelectValue placeholder="Filter by role" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Users</SelectItem>
                 <SelectItem value="shop">Shop Buyers</SelectItem>
                 <SelectItem value="retail">Retail Buyers</SelectItem>
                 <SelectItem value="unassigned">Unassigned</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </CardContent>
       </Card>
 
       {/* Users Table */}
       <Card className="shadow-card">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Users className="h-5 w-5" />
             Buyer Accounts ({filteredUsers.length})
           </CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="flex items-center justify-center py-12">
               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
           ) : (
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>User</TableHead>
                     <TableHead>Company</TableHead>
                     <TableHead>Role</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Joined</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredUsers.length === 0 ? (
                     <TableRow>
                       <TableCell
                         colSpan={6}
                         className="text-center py-12 text-muted-foreground"
                       >
                         No users found
                       </TableCell>
                     </TableRow>
                   ) : (
                     filteredUsers.map((user) => (
                       <TableRow key={user.id}>
                         <TableCell>
                           <div>
                             <p className="font-medium text-foreground">
                               {user.full_name || "—"}
                             </p>
                             <p className="text-sm text-muted-foreground flex items-center gap-1">
                               <Mail className="h-3 w-3" />
                               {user.email}
                             </p>
                             {user.phone && (
                               <p className="text-sm text-muted-foreground flex items-center gap-1">
                                 <Phone className="h-3 w-3" />
                                 {user.phone}
                               </p>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>
                           {user.company_name || (
                             <span className="text-muted-foreground">—</span>
                           )}
                         </TableCell>
                         <TableCell>
                           {user.role === "shop" && (
                             <Badge className="bg-shop text-shop-foreground">
                               <Building2 className="h-3 w-3 mr-1" />
                               Shop
                             </Badge>
                           )}
                           {user.role === "retail" && (
                             <Badge className="bg-retail text-retail-foreground">
                               <Store className="h-3 w-3 mr-1" />
                               Retail
                             </Badge>
                           )}
                           {!user.role && (
                             <Badge variant="outline" className="text-warning">
                               Unassigned
                             </Badge>
                           )}
                         </TableCell>
                         <TableCell>
                           {user.is_active ? (
                             <Badge
                               variant="secondary"
                               className="bg-success/10 text-success"
                             >
                               <ShieldCheck className="h-3 w-3 mr-1" />
                               Active
                             </Badge>
                           ) : (
                             <Badge
                               variant="secondary"
                               className="bg-destructive/10 text-destructive"
                             >
                               <ShieldOff className="h-3 w-3 mr-1" />
                               Inactive
                             </Badge>
                           )}
                         </TableCell>
                         <TableCell className="text-muted-foreground">
                           {new Date(user.created_at).toLocaleDateString()}
                         </TableCell>
                         <TableCell className="text-right">
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon">
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem
                                 onClick={() =>
                                   handleUpdateRole(user.user_id, "shop")
                                 }
                               >
                                 <Building2 className="h-4 w-4 mr-2 text-shop" />
                                 Set as Shop Buyer
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 onClick={() =>
                                   handleUpdateRole(user.user_id, "retail")
                                 }
                               >
                                 <Store className="h-4 w-4 mr-2 text-retail" />
                                 Set as Retail Buyer
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 onClick={() =>
                                   handleToggleActive(user.user_id, user.is_active)
                                 }
                               >
                                 {user.is_active ? (
                                   <>
                                     <ShieldOff className="h-4 w-4 mr-2 text-destructive" />
                                     Deactivate
                                   </>
                                 ) : (
                                   <>
                                     <ShieldCheck className="h-4 w-4 mr-2 text-success" />
                                     Activate
                                   </>
                                 )}
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }