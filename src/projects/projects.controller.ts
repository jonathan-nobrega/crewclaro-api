import { Body, Controller, Get, Post } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Controller("projects")
export class ProjectsController {
  constructor(private db: PrismaService) {}

  @Get()
  async list() {
    const data = await this.db.project.findMany({ orderBy: { createdAt: "desc" } });
    return { data, nextCursor: null };
  }

  @Post()
  create(@Body() body: { name: string; address: string }) {
    return this.db.project.create({ data: body });
  }
}
