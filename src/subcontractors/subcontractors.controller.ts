import { Body, Controller, Get, Post } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Controller("subcontractors")
export class SubcontractorsController {
  constructor(private db: PrismaService) {}

  @Get()
  async list() {
    const rows = await this.db.subcontractor.findMany({ include: { tasks: { select: { projectId: true } } } });
    const data = rows.map((s) => ({
      id: s.id, company: s.company, contact: s.contact, trade: s.trade, preferredLang: s.preferredLang,
      projectIds: [...new Set(s.tasks.map((t) => t.projectId))],
      compliance: { insuranceOnFile: s.insuranceOnFile, licenseExpiresAt: s.licenseExpiresAt },
    }));
    return { data, nextCursor: null };
  }

  @Post("invite")
  async invite(@Body() body: { company: string; contact: string; trade: string; lang: string }) {
    const sub = await this.db.subcontractor.create({
      data: { company: body.company, contact: body.contact, trade: body.trade, preferredLang: body.lang },
    });
    // TODO: send SMS/email invite via notifications provider
    return sub;
  }
}
