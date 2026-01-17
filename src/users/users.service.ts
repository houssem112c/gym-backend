import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                phone: true,
                avatar: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async searchUsers(query: string, currentUserId: string) {
        return this.prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                    { id: { not: currentUserId } },
                ],
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
            },
            take: 20,
        });
    }

    async getUserProfile(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                avatar: true,
                bio: true,
                role: true,
                _count: {
                    select: {
                        feedPosts: true,
                        sentRequests: { where: { status: 'ACCEPTED' } },
                        receivedRequests: { where: { status: 'ACCEPTED' } },
                    }
                }
            }
        });
    }

    async findOne(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                measurements: { orderBy: { createdAt: 'desc' }, take: 1 },
            }
        });
    }

    async create(createUserDto: any) {
        const { email, name, phone, password, role } = createUserDto;

        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new ConflictException('User already exists');

        const hashedPassword = await bcrypt.hash(password || phone || 'Gym123!', 10);

        return this.prisma.user.create({
            data: {
                email,
                name,
                phone,
                password: hashedPassword,
                role: role || 'USER',
            }
        });
    }

    async update(id: string, updateUserDto: any) {
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data: updateUserDto,
        });
    }

    async remove(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }

    async importFromExcel(file: Express.Multer.File) {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (const row of data as any[]) {
            try {
                const email = row['Email'] || row['email'];
                const firstName = row['first_name'] || row['First Name'] || '';
                const lastName = row['last_name'] || row['Last Name'] || '';
                const name = row['Full Name'] || row['Name'] || row['name'] || `${firstName} ${lastName}`.trim();
                const phone = row['phone_number'] || row['Phone'] || row['phone'] || row['Phone Number'];

                if (!email || !phone) {
                    results.failed++;
                    results.errors.push(`Missing email or phone for row: ${JSON.stringify(row)}`);
                    continue;
                }

                const emailStr = email.toString().toLowerCase().trim();
                const phoneStr = phone.toString().trim();

                let user = await this.prisma.user.findUnique({ where: { email: emailStr } });

                if (!user) {
                    const hashedPassword = await bcrypt.hash(phoneStr, 10);
                    user = await this.prisma.user.create({
                        data: {
                            email: emailStr,
                            name: name || emailStr.split('@')[0],
                            phone: phoneStr,
                            password: hashedPassword,
                        }
                    });
                    results.success++;
                }

                // Import additional data: Weight, Height
                const weight = row['weight_kg'] || row['Weight'] || row['weight'];
                const height = row['height_cm'] || row['Height'] || row['height'] || row['height_m'];

                if (weight) {
                    await this.prisma.userMeasurement.create({
                        data: {
                            userId: user.id,
                            weight: parseFloat(weight.toString()),
                        }
                    });
                }

            } catch (error) {
                results.failed++;
                results.errors.push(`Error processing row: ${error.message}`);
            }
        }

        return results;
    }

    async exportToExcel() {
        const users = await this.prisma.user.findMany({
            include: {
                measurements: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        const exportData = users.map(user => ({
            'Full Name': user.name,
            'Email': user.email,
            'Phone': user.phone,
            'Role': user.role,
            'Status': user.isActive ? 'Active' : 'Inactive',
            'Registered At': user.createdAt.toISOString().split('T')[0],
            'Latest Weight (kg)': user.measurements[0]?.weight || 'N/A',
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }
}
