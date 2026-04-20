import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Task {
  id?: number;
  title: string;
  description: string;
  deadline: string;
  status?: string;
  creatorUsername?: string;
  assigneeUsername?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'https://bubblegum-task-management-system.onrender.com/tasks';

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateStatus(id: number, status: string): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }

  assignTask(id: number, assigneeId: number): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}/assign/${assigneeId}`, {});
  }
}