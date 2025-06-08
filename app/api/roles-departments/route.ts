import { NextResponse } from 'next/server';
import { getStorage } from '@/server/storage';
import { DepartmentRoleSummary } from '@/server/storage';
import { JobRole, Department } from '@/lib/session/sessionTypes';

function convertToSessionTypes(data: DepartmentRoleSummary[]): { hierarchical: Department[], roles: JobRole[] } {
    const hierarchical: Department[] = [];
    const roles: JobRole[] = [];

    data.forEach(summary => {
        const departmentRoles: JobRole[] = (summary.roles || []).map(role => {
            const sessionRole: JobRole = {
                id: String(role.id),
                title: role.title,
                departmentId: String(summary.department_id),
                level: role.level as any, // Assuming level matches the enum
                skills: role.skills || [],
                description: role.description || undefined,
                isActive: role.is_active,
                createdAt: role.created_at.toISOString(),
                updatedAt: role.updated_at.toISOString(),
            };
            roles.push(sessionRole);
            return sessionRole;
        });

        hierarchical.push({
            id: String(summary.department_id),
            name: summary.department_name,
            description: summary.department_description || undefined,
            roles: departmentRoles,
            createdAt: new Date().toISOString(), // This should be from the DB
            updatedAt: summary.last_updated || new Date().toISOString(),
        });
    });

    return { hierarchical, roles };
}


export async function GET() {
    try {
        const storage = getStorage();
        const summaryData = await storage.getDepartmentRoleSummary();
        
        const { hierarchical, roles } = convertToSessionTypes(summaryData);

        return NextResponse.json({
            hierarchical,
            roles,
            metadata: {
                totalDepartments: hierarchical.length,
                totalRoles: roles.length,
                lastUpdated: new Date().toISOString(),
                cacheVersion: '1.0.0',
            }
        });
    } catch (error) {
        console.error("Error fetching department/role summary:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 