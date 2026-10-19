import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

@Controller()
export class TasksController {
  constructor(private db: PrismaService, private realtime: RealtimeGateway) {}

  @Get("projects/:id/tasks")
  async list(@Param("id") projectId: string, @Query("trade") trade?: string, @Query("status") status?: string) {
    const data = await this.db.task.findMany({
      where: { projectId, ...(trade && { trade }), ...(status && { status }) },
      include: { assignee: { select: { id: true, company: true } } },
    });
    return { data, nextCursor: null };
  }

  @Post("projects/:id/tasks")
  create(@Param("id") projectId: string, @Body() body: { title: string; trade: string; assigneeId?: string; dueDate?: string }) {
    // Title is stored as { [lang]: text }; translator fills the other languages.
    return this.db.task.create({
      data: { projectId, title: { en: body.title }, trade: body.trade, assigneeId: body.assigneeId,
              dueDate: body.dueDate ? new Date(body.dueDate) : undefined },
    });
  }

  @Patch("tasks/:id")
  async update(@Param("id") id: string, @Body() body: { status?: string; assigneeId?: string; dueDate?: string }) {
    const task = await this.db.task.update({
      where: { id },
      data: { ...body, dueDate: body.dueDate ? new Date(body.dueDate) : undefined },
    });
    this.realtime.emit(task.projectId, "task.updated", task);
    return task;
  }
}
