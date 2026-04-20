import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { TaskListComponent } from './components/task-list/task-list';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'tasks', component: TaskListComponent }
];