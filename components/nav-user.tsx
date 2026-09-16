"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { signOut } from "next-auth/react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LogOutIcon, Settings2Icon, WifiIcon } from "lucide-react"

export function NavUser({
  onOpenNetworkSettings,
}: {
  onOpenNetworkSettings: () => void
}) {
  const { isMobile } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="Network Settings" onClick={onOpenNetworkSettings}>
          <WifiIcon />
          <span>Network</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="Sign out" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOutIcon />
          <span>Sign out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
