import { AuthProvider } from '@/contexts/auth-context';
// TODO: Import DashboardNav and DashboardSidebar from the correct path
// import { DashboardNav } from '@/components/layout/dashboard-nav'
// import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50">
                {/* <DashboardNav /> */}
                <div className="flex">
                    {/* <DashboardSidebar /> */}
                    <main className="flex-1 p-6">
                        {children}
                    </main>
                </div>
            </div>
        </AuthProvider>
    )
}