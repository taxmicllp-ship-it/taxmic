import { prisma } from '@repo/database';
import { CreateTaskDto, UpdateTaskDto, ListTasksQuery } from './tasks.types';

const taskInclude = {
  task_assignments: {
    select: { user_id: true, assigned_at: true },
  },
};

class TasksRepository {
  async create(firmId: string, userId: string, data: CreateTaskDto) {
    const { assignee_ids, due_date, ...rest } = data;

    const task = await prisma.tasks.create({
      data: {
        firm_id: firmId,
        created_by: userId,
        title: rest.title,
        description: rest.description,
        status: (rest.status as any) ?? 'new',
        priority: (rest.priority as any) ?? 'medium',
        due_date: due_date ? new Date(due_date) : null,
        client_id: rest.client_id ?? null,
        ...(assignee_ids?.length
          ? {
              task_assignments: {
                create: assignee_ids.map((uid) => ({
                  user_id: uid,
                  assigned_by: userId,
                })),
              },
            }
          : {}),
      },
      include: taskInclude,
    });

    return task;
  }

  async findById(firmId: string, taskId: string) {
    return prisma.tasks.findFirst({
      where: { id: taskId, firm_id: firmId, deleted_at: null },
      include: taskInclude,
    });
  }

  async findAll(firmId: string, filters: ListTasksQuery) {
    const { client_id, assignee_id, status, due_date, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = { firm_id: firmId, deleted_at: null };

    if (client_id) where.client_id = client_id;
    if (status) where.status = status;
    if (due_date) where.due_date = new Date(due_date);
    if (assignee_id) {
      where.task_assignments = { some: { user_id: assignee_id } };
    }

    const [data, total] = await Promise.all([
      prisma.tasks.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ due_date: 'asc' }, { created_at: 'desc' }],
        include: taskInclude,
      }),
      prisma.tasks.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByClient(firmId: string, clientId: string) {
    return prisma.tasks.findMany({
      where: { firm_id: firmId, client_id: clientId, deleted_at: null },
      orderBy: [{ due_date: 'asc' }, { created_at: 'desc' }],
      include: taskInclude,
    });
  }

  async update(firmId: string, taskId: string, data: UpdateTaskDto & { completed_at?: Date | null }) {
    const { assignee_ids, due_date, completed_at, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      if (assignee_ids !== undefined) {
        await tx.task_assignments.deleteMany({ where: { task_id: taskId } });
        if (assignee_ids.length > 0) {
          await tx.task_assignments.createMany({
            data: assignee_ids.map((uid) => ({ task_id: taskId, user_id: uid })),
          });
        }
      }

      return tx.tasks.update({
        where: { id: taskId, firm_id: firmId },
        data: {
          ...(rest.title !== undefined && { title: rest.title }),
          ...(rest.description !== undefined && { description: rest.description }),
          ...(rest.status !== undefined && { status: rest.status as any }),
          ...(rest.priority !== undefined && { priority: rest.priority as any }),
          ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
          ...(rest.client_id !== undefined && { client_id: rest.client_id }),
          ...(completed_at !== undefined && { completed_at }),
        },
        include: taskInclude,
      });
    });
  }

  async softDelete(firmId: string, taskId: string) {
    await prisma.tasks.update({
      where: { id: taskId, firm_id: firmId },
      data: { deleted_at: new Date() },
    });
  }
}

export const tasksRepository = new TasksRepository();
