import AppLayout from "@/components/layout/AppLayout";

interface AppGroupLayoutProps {
    children: React.ReactNode;
}

// This layout applies the AppLayout (sidebar+header) to all routes within the (app) group.
export default function AppGroupLayout({ children }: AppGroupLayoutProps) {
    return (
        <AppLayout>
            {children}
        </AppLayout>
    );
} 