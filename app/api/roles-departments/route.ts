import { NextResponse } from 'next/server';
import { getStorage } from '@/server/storage';
import { DepartmentRoleSummary } from '@/server/storage';
import { JobRole, Department } from '@/lib/session/sessionTypes';

// Extended Department type to include roles array
interface DepartmentWithRoles extends Department {
    roles: JobRole[];
}

function convertToSessionTypes(data: DepartmentRoleSummary[]): { hierarchical: DepartmentWithRoles[], roles: JobRole[] } {
    const hierarchical: DepartmentWithRoles[] = [];
    const roles: JobRole[] = [];

    data.forEach(summary => {
        // Extract roles from summary and add missing departmentId
        const departmentRoles: JobRole[] = (summary.roles || []).map(role => {
            // Map database JobRole to session JobRole type with safe property access
            const sessionRole: JobRole = {
                id: role.id,
                title: role.title,
                departmentId: role.departmentId || summary.department_id, // Use department_id from summary if role doesn't have it
                level: role.level || null,
                skills: role.skills || [],
                description: role.description || null,
                keyResponsibilities: role.keyResponsibilities || [],
                aiPotential: role.aiPotential || null,
                is_active: role.is_active !== undefined ? role.is_active : true,
                created_at: role.created_at || new Date(),
                updated_at: role.updated_at || new Date(),
            };
            roles.push(sessionRole);
            return sessionRole;
        });

        // Map database Department to session Department type with nested roles
        hierarchical.push({
            id: summary.department_id,
            name: summary.department_name,
            description: summary.department_description || null,
            is_active: true, // Default to true if not specified
            created_at: new Date(), // This should be from the DB
            updated_at: new Date(),
            roles: departmentRoles, // Nest roles under their department
        });
    });

    return { hierarchical, roles };
}


export async function GET() {
    try {
        // Log environment and database connection details
        console.log('=== DATABASE CONNECTION DEBUG ===');
        console.log('Environment Variables:');
        console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
        console.log('- NODE_ENV:', process.env.NODE_ENV);
        console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
        console.log('- DATABASE_POSTGRES_URL exists:', !!process.env.DATABASE_POSTGRES_URL);
        console.log('- DATABASE_PREVIEW_URL exists:', !!process.env.DATABASE_PREVIEW_URL);
        
        const storage = getStorage();
        const summaryData = await storage.getDepartmentRoleSummary();
        
        // Log raw data from database for debugging
        console.log('Raw summary data count:', summaryData.length);
        const financeData = summaryData.find(dept => dept.department_name.includes('Finance'));
        if (financeData) {
            console.log('Finance department raw data:', {
                id: financeData.department_id,
                name: financeData.department_name,
                rolesCount: financeData.roles?.length || 0,
                roles: financeData.roles?.map(r => ({ id: r.id, title: r.title })) || []
            });
        } else {
            console.log('No Finance department found in raw data');
            console.log('Available departments:', summaryData.map(d => ({ id: d.department_id, name: d.department_name })));
        }
        console.log('=== END DATABASE DEBUG ===');
        
        const { hierarchical, roles } = convertToSessionTypes(summaryData);

        return NextResponse.json({
            hierarchical,
            roles,
            metadata: {
                totalDepartments: hierarchical.length,
                totalRoles: roles.length,
                lastUpdated: new Date().toISOString(),
                cacheVersion: '1.0.0',
                debugInfo: {
                    vercelEnv: process.env.VERCEL_ENV,
                    rawDataCount: summaryData.length,
                    financeFound: !!financeData,
                    financeRolesCount: financeData?.roles?.length || 0
                }
            }
        });
    } catch (error) {
        console.error("Error fetching department/role summary:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 