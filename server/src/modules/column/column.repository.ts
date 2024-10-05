import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { Column, Prisma } from '@prisma/client';
import { CreateColumnDto } from './dto/create-column.dto';
import { TaskService } from '@task/task.service';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskService: TaskService,
  ) {}

  async createColumn(body: CreateColumnDto, companyId: string) {
  
    const key = await this.generateUniqueKey(body.key, companyId);
  
    const data: Prisma.ColumnCreateInput = {
      sheet: { connect: { id: body.sheetId } },
      company: { connect: { id: companyId } },
      name: body.name,
      key,
      show: body.show,
      type: body.type,
    };

    const fieldMapping: Record<string, string[]> = {
      text: ['text1', 'text2', 'text3', 'text4', 'text5'],
      number: ['number1', 'number2', 'number3', 'number4', 'number5'],
      checkbox: ['checkbox1', 'checkbox2', 'checkbox3', 'checkbox4', 'checkbox5'],
      select: ['select1', 'select2', 'select3', 'select4', 'select5'],
      date: ['date1', 'date2', 'date3', 'date4', 'date5'],
    };
  
    const fieldsToCheck = fieldMapping[body.type.toLowerCase()] || [];
  
    const tasks = await this.taskService.findBySheet(body.sheetId);
    const fieldToUpdate = fieldsToCheck.find((field) =>
      tasks.some((task) => task[field] === null)
    );
    if (!fieldToUpdate) {
      return; // Return early if no field to update
    }
  
  
    try {
      await this.taskService.updateMany({
        where: { sheetId: body.sheetId, [fieldToUpdate]: null },
        data: { [fieldToUpdate]: key },
      });
    } catch (error) {
      throw new Error('Failed to update tasks after column creation');
    }
  
    // Finally, create the new column
    return this.prisma.column.create({ data });
  }

  async updateColumn(columnId: string, body: UpdateColumnDto): Promise<Column> {
    const data: Prisma.ColumnUpdateInput = {
      name: body.name,
      show: body.show,
      type: body.type,
    };

    return this.prisma.column.update({ where: { id: columnId }, data });
  }

  async findById(columnId: string): Promise<Column | null> {
    return this.prisma.column.findUnique({
      where: { id: columnId },
    });
  }

  async deleteColumn(id: string): Promise<Column> {
    return this.prisma.column.delete({ where: { id } });
  }

  private async generateUniqueKey(key: string, companyId: string): Promise<string> {
    const existingKeys = await this.prisma.column.findMany({
      where: { companyId },
      select: { key: true },
    });

    let uniqueKey = key;
    let suffix = 1;

    while (existingKeys.some((column) => column.key === uniqueKey)) {
      uniqueKey = `${key}_${suffix++}`;
    }

    return uniqueKey;
  }
}
