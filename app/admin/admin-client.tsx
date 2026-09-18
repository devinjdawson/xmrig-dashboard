"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserPlus, Shield, Settings2 } from "lucide-react"

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  totpEnabled: boolean
  emailVerified: boolean
  createdAt: string
}

export function AdminClient() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [newUser, setNewUser] = useState<{ email: string; name: string; role: string }>({ email: "", name: "", role: "user" })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const res = await fetch("/api/users")
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to load users")
        return
      }
      const data = await res.json()
      setUsers(data as User[])
      setError(null)
    } catch (err) {
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddUser() {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to add user")
        return
      }
      
      setShowAddSheet(false)
      setNewUser({ email: "", name: "", role: "user" })
      loadUsers()
    } catch (err) {
      setError("Failed to add user")
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to delete user")
        return
      }
      
      loadUsers()
    } catch (err) {
      setError("Failed to delete user")
    }
  }

  async function handleUpdateRole(userId: string, role: string) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to update role")
        return
      }
      
      loadUsers()
    } catch (err) {
      setError("Failed to update role")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their permissions</p>
        </div>
        <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
          <SheetTrigger>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New User</SheetTitle>
              <SheetDescription>
                Create a new user account. The user will receive an email with login instructions.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value || "user" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setShowAddSheet(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={!newUser.email}>
                Add User
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {user.role === "admin" && <Shield className="h-4 w-4 text-primary" />}
                    <div>
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.totpEnabled && (
                      <Badge variant="secondary">
                        <Settings2 className="h-3 w-3 mr-1" />
                        2FA
                      </Badge>
                    )}
                    {user.emailVerified && (
                      <Badge variant="outline">Verified</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleUpdateRole(user.id || "", value || user.role)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteUser(user.id || "")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
