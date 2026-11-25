import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  // ============ CREATE TASK ============
  async createTask(createDto: CreateTaskDto, assignedById: string) {
    // Verify assignee exists
    const assignee = await this.prisma.user.findUnique({
      where: { id: createDto.assignedToId },
    });

    if (!assignee) {
      throw new NotFoundException('Assigned user not found');
    }

    return this.prisma.task.create({
      data: {
        ...createDto,
        assignedById,
        priority: createDto.priority || TaskPriority.MEDIUM,
      },
      include: {
        assignedTo: { include: { staffProfile: true } },
        assignedBy: true,
      },
    });
  }

  // ============ UPDATE TASK ============
  async updateTask(taskId: string, updateDto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    // If reassigning, verify new assignee exists
    if (updateDto.assignedToId) {
      const newAssignee = await this.prisma.user.findUnique({
        where: { id: updateDto.assignedToId },
      });
      if (!newAssignee) throw new NotFoundException('New assignee not found');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateDto,
      include: {
        assignedTo: { include: { staffProfile: true } },
        assignedBy: true,
      },
    });
  }

  async completeTask(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  async escalateTask(taskId: string, escalatedTo: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.ESCALATED,
        escalatedAt: new Date(),
        escalatedTo,
      },
    });
  }

  // ============ TASK LISTING ============
  async getTasksForStaff(staffId: string, limit = 50, offset = 0) {
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where: { assignedToId: staffId },
        take: limit,
        skip: offset,
        orderBy: { dueAt: 'asc' },
        include: {
          assignedBy: true,
          assignedTo: { include: { staffProfile: true } },
        },
      }),
      this.prisma.task.count({ where: { assignedToId: staffId } }),
    ]);

    return { tasks, total, limit, offset };
  }

  async getTasksByStatus(status: TaskStatus, limit = 50, offset = 0) {
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where: { status },
        take: limit,
        skip: offset,
        orderBy: { dueAt: 'asc' },
        include: {
          assignedBy: true,
          assignedTo: { include: { staffProfile: true } },
        },
      }),
      this.prisma.task.count({ where: { status } }),
    ]);

    return { tasks, total, limit, offset };
  }

  async getTasksByPriority(priority: TaskPriority, limit = 50, offset = 0) {
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where: { priority },
        take: limit,
        skip: offset,
        orderBy: { dueAt: 'asc' },
        include: {
          assignedBy: true,
          assignedTo: { include: { staffProfile: true } },
        },
      }),
      this.prisma.task.count({ where: { priority } }),
    ]);

    return { tasks, total, limit, offset };
  }

  async getTaskById(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedBy: true,
        assignedTo: { include: { staffProfile: true } },
      },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async getOverdueTasks() {
    return this.prisma.task.findMany({
      where: {
        dueAt: { lt: new Date() },
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      },
      orderBy: { dueAt: 'asc' },
      include: {
        assignedTo: { include: { staffProfile: true } },
      },
    });
  }

  // ============ TASK ANALYTICS ============
  async getTaskAnalytics(staffId?: string) {
    const where = staffId ? { assignedToId: staffId } : {};

    const [pending, inProgress, completed, escalated] = await Promise.all([
      this.prisma.task.count({ where: { ...where, status: TaskStatus.PENDING } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.IN_PROGRESS } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.COMPLETED } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.ESCALATED } }),
    ]);

    const totalTasks = pending + inProgress + completed + escalated;
    const completionRate = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;

    return {
      pending,
      inProgress,
      completed,
      escalated,
      totalTasks,
      completionRate: completionRate.toFixed(2) + '%',
    };
  }

  async getStaffPerformance(staffId: string) {
    const tasksCompleted = await this.prisma.task.count({
      where: { assignedToId: staffId, status: TaskStatus.COMPLETED },
    });

    const tasksPending = await this.prisma.task.count({
      where: { assignedToId: staffId, status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } },
    });

    const avgCompletionTime = await this.getAverageCompletionTime(staffId);

    return {
      staffId,
      tasksCompleted,
      tasksPending,
      avgCompletionTimeHours: avgCompletionTime,
      totalTasks: tasksCompleted + tasksPending,
    };
  }

  private async getAverageCompletionTime(staffId: string): Promise<number> {
    const completedTasks = await this.prisma.task.findMany({
      where: {
        assignedToId: staffId,
        status: TaskStatus.COMPLETED,
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
    });

    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      if (!task.completedAt) return sum;
      const hours = (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.round(totalTime / completedTasks.length);
  }
}
