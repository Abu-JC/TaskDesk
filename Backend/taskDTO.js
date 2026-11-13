// taskDto.js

export class CreateTaskRequestDTO {
  constructor(rawData) {
    this.title = rawData.title?.trim();
    this.description = rawData.description?.trim() || null;
    this.status = rawData.status || 'todo';
  }

  validate() {
    if (!this.title) {
      throw new Error("Validation Error: Task title is required");
    }
  }
}

export class UpdateTaskRequestDTO {
  constructor(rawData) {
    this.title = rawData.title !== undefined ? rawData.title.trim() : undefined;
    this.description = rawData.description !== undefined ? rawData.description?.trim() || null : undefined;
    this.status = rawData.status;
  }
}

export function toTaskResponseDTO(task) {
  return {
    id: task.uuid,        // Expose public UUID to the client
    title: task.title,
    description: task.description,
    status: task.status,
    // internal database 'id' and 'created_at' remain hidden
  };
}
