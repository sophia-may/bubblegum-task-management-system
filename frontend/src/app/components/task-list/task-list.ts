import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../services/task';
import { FriendService, UserDto, FriendshipDto } from '../../services/friend';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

type DeadlinePreset = 'today' | 'tomorrow' | 'other';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit, AfterViewInit {
  @ViewChild('boardsContainer') boardsContainer!: ElementRef;
  boardScrollPercent: number = 0;
  showBoardControls: boolean = false;

  inlineCreateListId: string | null = null;
  inlineCreateTitle: string = '';
  inlineCreateDetails: string = '';
  inlineDeadlinePreset: DeadlinePreset = 'today';
  inlineDeadlineCustom: string = '';

  tasks: Task[] = [];
  newTask: Task = { title: '', description: '', deadline: '' };
  assigneeIdMap: { [taskId: number]: number } = {}; // Lưu ID người được giao cho từng task
  searchQuery: string = '';
  isStarredView: boolean = false;
  activeTab: 'tasks' | 'starred' = 'tasks';
  newGroupName: string = '';
  isAddingGroup: boolean = false;
  isCreateTaskModalOpen: boolean = false;
  openListMenuId: string | null = null;
  createTaskDeadlinePreset: DeadlinePreset = 'today';
  createTaskDeadlineCustom: string = '';
  createTaskForm: { title: string; description: string; deadline: string; listId: string; assigneeId?: number | null } = {
    title: '',
    description: '',
    deadline: '',
    listId: '1',
    assigneeId: null
  };

  // Friend Modal State
  isFriendModalOpen: boolean = false;
  friendSearchQuery: string = '';
  friendSearchResults: UserDto[] = [];
  friendsList: UserDto[] = [];
  pendingRequests: FriendshipDto[] = [];
  friendTab: 'friends' | 'pending' | 'search' = 'friends';

  isSidebarCollapsed: boolean = false;
  isTeamsExpanded: boolean = true;
  currentUsername: string = 'Khách';
  readonly defaultLists: { id: string, name: string, count: number, checked: boolean, showCompleted: boolean }[] = [
    { id: '1', name: 'Việc cần làm của tôi', count: 1, checked: true, showCompleted: false },
    { id: '2', name: 'Dự án cá nhân', count: 1, checked: true, showCompleted: false },
    { id: '3', name: 'Việc trên trường', count: 2, checked: false, showCompleted: false }
  ];
  myLists: { id: string, name: string, count: number, checked: boolean, showCompleted: boolean }[] = [
    { id: '1', name: 'Việc cần làm của tôi', count: 1, checked: true, showCompleted: false },
    { id: '2', name: 'Dự án cá nhân', count: 1, checked: true, showCompleted: false },
    { id: '3', name: 'Việc trên trường', count: 2, checked: false, showCompleted: false }
  ];
  taskMetadata: { [taskId: number]: { listId: string; starred: boolean } } = {};

  // Hàm tự động lọc ra các danh sách đang được tick chọn
  get selectedLists() {
    return this.myLists.filter(list => list.checked);
  }

  get activeTasks() {
    return this.tasks.filter(t => t.status !== 'DONE');
  }

  get completedTasks() {
    return this.tasks.filter(t => t.status === 'DONE');
  }

  get hasAnyVisibleTask(): boolean {
    return this.selectedLists.some((list) => this.getActiveTasksForList(list.id).length > 0 || this.getCompletedTasksForList(list.id).length > 0);
  }

  get shouldShowTaskBoards(): boolean {
    if (this.selectedLists.length === 0) return false;
    if (this.isStarredView && !this.hasAnyVisibleTask) return false;
    return true;
  }

  constructor(
    private taskService: TaskService,
    private friendService: FriendService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('username');
      if(storedUser){
        this.currentUsername = storedUser;
      }
      this.loadLists();
      this.loadTaskMetadata();
      this.loadTasks();
      this.loadFriendsData();
    }
  }

  private getListsStorageKey(): string {
    return `taskman_lists_${this.currentUsername}`;
  }

  private getMetaStorageKey(): string {
    return `taskman_task_meta_${this.currentUsername}`;
  }

  private loadLists(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = localStorage.getItem(this.getListsStorageKey());
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.myLists = parsed;
      }
    } catch {
      this.myLists = [...this.defaultLists];
    }
  }

  private saveLists(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.getListsStorageKey(), JSON.stringify(this.myLists));
  }

  private loadTaskMetadata(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = localStorage.getItem(this.getMetaStorageKey());
    if (!raw) return;

    try {
      this.taskMetadata = JSON.parse(raw) ?? {};
    } catch {
      this.taskMetadata = {};
    }
  }

  private saveTaskMetadata(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.getMetaStorageKey(), JSON.stringify(this.taskMetadata));
  }

  private normalizeTaskMetadata(): void {
    const existingIds = new Set(this.tasks.map((task) => task.id).filter((id): id is number => !!id));
    const firstListId = this.myLists[0]?.id ?? '1';

    this.tasks.forEach((task) => {
      if (!task.id) return;
      if (!this.taskMetadata[task.id]) {
        this.taskMetadata[task.id] = { listId: firstListId, starred: false };
      }
    });

    Object.keys(this.taskMetadata).forEach((key) => {
      const numericId = Number(key);
      if (!existingIds.has(numericId)) {
        delete this.taskMetadata[numericId];
      }
    });

    this.saveTaskMetadata();
  }

  private ensureValidGroupMapping(): void {
    const validListIds = new Set(this.myLists.map((list) => list.id));
    const fallbackId = this.myLists[0]?.id ?? '1';

    Object.values(this.taskMetadata).forEach((meta) => {
      if (!validListIds.has(meta.listId)) {
        meta.listId = fallbackId;
      }
    });

    this.saveTaskMetadata();
  }

  private setTaskList(taskId: number, listId: string): void {
    const existing = this.taskMetadata[taskId] ?? { listId, starred: false };
    this.taskMetadata[taskId] = { ...existing, listId };
    this.saveTaskMetadata();
  }

  private normalizeText(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private formatLocalDateTime(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private buildDeadline(preset: DeadlinePreset, custom: string): string {
    if (preset === 'other') {
      return custom.trim();
    }

    const deadline = new Date();
    if (preset === 'tomorrow') {
      deadline.setDate(deadline.getDate() + 1);
    }
    deadline.setHours(23, 59, 0, 0);
    return this.formatLocalDateTime(deadline);
  }

  private matchesSearch(task: Task): boolean {
    if (!this.searchQuery.trim()) return true;
    const keyword = this.normalizeText(this.searchQuery);
    const target = [task.title, task.description, task.creatorUsername, task.assigneeUsername, task.status]
      .filter(Boolean)
      .map((value) => this.normalizeText(value))
      .join(' ');
    return target.includes(keyword);
  }

  private matchesStarFilter(taskId?: number): boolean {
    if (!this.isStarredView) return true;
    if (!taskId) return false;
    return this.taskMetadata[taskId]?.starred ?? false;
  }

  private matchesList(taskId: number | undefined, listId: string): boolean {
    if (!taskId) return false;
    return (this.taskMetadata[taskId]?.listId ?? this.myLists[0]?.id ?? '1') === listId;
  }

  getListCount(listId: string): number {
    return this.tasks.filter((task) => task.status !== 'DONE' && this.matchesList(task.id, listId)).length;
  }

  getActiveTasksForList(listId: string): Task[] {
    return this.tasks.filter((task) => {
      if (task.status === 'DONE') return false;
      if (!this.matchesList(task.id, listId)) return false;
      if (!this.matchesSearch(task)) return false;
      if (!this.matchesStarFilter(task.id)) return false;
      return true;
    });
  }

  getCompletedTasksForList(listId: string): Task[] {
    return this.tasks.filter((task) => {
      if (task.status !== 'DONE') return false;
      if (!this.matchesList(task.id, listId)) return false;
      if (!this.matchesSearch(task)) return false;
      if (!this.matchesStarFilter(task.id)) return false;
      return true;
    });
  }

  toggleStarredView(): void {
    this.activeTab = 'starred';
    this.isStarredView = true;
  }

  showTasksView(): void {
    this.activeTab = 'tasks';
    this.isStarredView = false;
  }

  isTaskStarred(taskId?: number): boolean {
    if (!taskId) return false;
    return this.taskMetadata[taskId]?.starred ?? false;
  }

  toggleTaskStar(taskId?: number): void {
    if (!taskId) return;
    const existing = this.taskMetadata[taskId] ?? { listId: this.myLists[0]?.id ?? '1', starred: false };
    this.taskMetadata[taskId] = { ...existing, starred: !existing.starred };
    this.saveTaskMetadata();
  }

  beginAddGroup(): void {
    this.isAddingGroup = true;
    this.newGroupName = '';
  }

  cancelAddGroup(): void {
    this.isAddingGroup = false;
    this.newGroupName = '';
  }

  createNewGroup(): void {
    const name = this.newGroupName.trim();
    if (!name) {
      this.cancelAddGroup();
      return;
    }

    const exists = this.myLists.some((list) => list.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert('Tên nhóm đã tồn tại.');
      return;
    }

    const newId = Date.now().toString();
    this.myLists.push({ id: newId, name, count: 0, checked: true, showCompleted: false });
    this.saveLists();
    this.cancelAddGroup();
  }

  openCreateTaskModal(): void {
    this.isCreateTaskModalOpen = true;
    const preferredListId = this.selectedLists[0]?.id ?? this.myLists[0]?.id ?? '1';
    this.createTaskDeadlinePreset = 'today';
    this.createTaskDeadlineCustom = '';
    this.createTaskForm = {
      title: '',
      description: '',
      deadline: '',
      listId: preferredListId,
      assigneeId: null
    };
    this.loadFriendsData(); // Tải danh sách bạn bè khi mở popup tạo task
  }

  closeCreateTaskModal(): void {
    this.isCreateTaskModalOpen = false;
  }

  toggleListMenu(listId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openListMenuId = this.openListMenuId === listId ? null : listId;
  }

  closeListMenu(): void {
    this.openListMenuId = null;
  }

  deleteList(listId: string): void {
    const list = this.myLists.find((item) => item.id === listId);
    if (!list) return;

    if (this.myLists.length <= 1) {
      alert('Phải giữ lại ít nhất một danh sách.');
      return;
    }

    if (typeof window !== 'undefined' && !window.confirm(`Xóa danh sách "${list.name}"? Các task trong danh sách sẽ được chuyển sang danh sách khác.`)) {
      return;
    }

    const fallbackListId = this.myLists.find((item) => item.id !== listId)?.id ?? this.myLists[0].id;
    this.myLists = this.myLists.filter((item) => item.id !== listId);

    Object.keys(this.taskMetadata).forEach((taskId) => {
      const numericTaskId = Number(taskId);
      const meta = this.taskMetadata[numericTaskId];
      if (meta?.listId === listId) {
        this.taskMetadata[numericTaskId] = { ...meta, listId: fallbackListId };
      }
    });

    if (this.inlineCreateListId === listId) {
      this.closeInlineCreate();
    }

    if (this.createTaskForm.listId === listId) {
      this.createTaskForm.listId = fallbackListId;
    }

    this.openListMenuId = null;
    this.saveLists();
    this.saveTaskMetadata();
    this.checkBoardControls();
  }

  onListCheckedChange(): void {
    this.saveLists();
    setTimeout(() => this.checkBoardControls(), 100);
  }

  trackByListId(index: number, list: any): string {
    return list.id;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  toggleTeams() {
    this.isTeamsExpanded = !this.isTeamsExpanded;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.normalizeTaskMetadata();
        this.ensureValidGroupMapping();
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Lỗi tải tasks', err);
        if (err.status === 403) this.logout(); // Nếu token hết hạn thì bắt đăng nhập lại
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.checkBoardControls(), 100);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkBoardControls();
  }

  checkBoardControls() {
    if (!this.boardsContainer) return;
    const el = this.boardsContainer.nativeElement;
    this.showBoardControls = el.scrollWidth > el.clientWidth;
    this.updateScrollPercent();
    this.cdr.detectChanges();
  }

  onBoardsScroll() {
    this.updateScrollPercent();
  }

  updateScrollPercent() {
    if (!this.boardsContainer) return;
    const el = this.boardsContainer.nativeElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      this.boardScrollPercent = (el.scrollLeft / maxScroll) * 100;
    } else {
      this.boardScrollPercent = 0;
    }
  }

  onBoardRangeChange(value: string | number) {
    if (!this.boardsContainer) return;
    const el = this.boardsContainer.nativeElement;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollLeft = (Number(value) / 100) * maxScroll;
  }

  scrollBoards(direction: 'left' | 'right') {
    if (!this.boardsContainer) return;
    const el = this.boardsContainer.nativeElement;
    const amount = 340 + 24; // width + gap
    if (direction === 'left') {
      const newPos = Math.max(0, el.scrollLeft - amount);
      el.scrollTo({ left: newPos, behavior: 'smooth' });
      // update scroll percent after delay
      setTimeout(() => this.updateScrollPercent(), 300);
    } else {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const newPos = Math.min(maxScroll, el.scrollLeft + amount);
      el.scrollTo({ left: newPos, behavior: 'smooth' });
      setTimeout(() => this.updateScrollPercent(), 300);
    }
  }

  openInlineCreate(listId: string) {
    this.inlineCreateListId = listId;
    this.inlineCreateTitle = '';
    this.inlineCreateDetails = '';
    this.inlineDeadlinePreset = 'today';
    this.inlineDeadlineCustom = '';
    setTimeout(() => {
      // Focus if needed
    }, 0);
  }

  closeInlineCreate() {
    this.inlineCreateListId = null;
    this.inlineCreateTitle = '';
    this.inlineCreateDetails = '';
    this.inlineDeadlinePreset = 'today';
    this.inlineDeadlineCustom = '';
  }

  submitInlineCreate() {
    if (!this.inlineCreateTitle.trim() || !this.inlineCreateListId) {
      alert('Vui lòng nhập tên nhiệm vụ!');
      return;
    }
    const taskPayload: Task = {
      title: this.inlineCreateTitle.trim(),
      description: this.inlineCreateDetails.trim(),
      deadline: this.buildDeadline(this.inlineDeadlinePreset, this.inlineDeadlineCustom)
    };
    
    this.taskService.createTask(taskPayload).subscribe({
      next: (createdTask) => {
        if (createdTask?.id) {
          this.setTaskList(createdTask.id, this.inlineCreateListId!);
        }
        this.closeInlineCreate();
        this.loadTasks(); // Load lại danh sách
        this.checkBoardControls();
      },
      error: (err) => console.error('Lỗi tạo task', err)
    });
  }

  createTaskFromModal() {
    const deadline = this.buildDeadline(this.createTaskDeadlinePreset, this.createTaskDeadlineCustom);

    if (!this.createTaskForm.title || !deadline || !this.createTaskForm.listId) {
      alert('Vui lòng nhập đủ Tiêu đề và Deadline!');
      return;
    }

    const taskPayload: Task = {
      title: this.createTaskForm.title,
      description: this.createTaskForm.description,
      deadline
    };
    
    this.taskService.createTask(taskPayload).subscribe({
      next: (createdTask) => {
        if (createdTask?.id) {
          this.setTaskList(createdTask.id, this.createTaskForm.listId);
          
          // Giao việc cho bạn bè luôn nếu có chọn
          if (this.createTaskForm.assigneeId) {
            this.taskService.assignTask(createdTask.id, this.createTaskForm.assigneeId).subscribe({
               next: () => this.loadTasks(),
               error: (e) => console.error("Error assigning task", e)
            });
          }
        }
        alert('Tạo task thành công!');
        this.closeCreateTaskModal();
        this.loadTasks(); // Load lại danh sách
      },
      error: (err) => console.error('Lỗi tạo task', err)
    });
  }

  updateStatus(id: number | undefined, newStatus: string) {
    if (!id) return;
    this.taskService.updateStatus(id, newStatus).subscribe({
      next: () => this.loadTasks(),
      error: (err) => alert('Lỗi: ' + (err.error?.message || err.message))
    });
  }

  markAsDone(id: number | undefined) {
    this.updateStatus(id, 'DONE');
  }

  assignTask(taskId: number | undefined) {
    if (!taskId) return;
    const assigneeId = this.assigneeIdMap[taskId];
    if (!assigneeId) {
      alert('Vui lòng nhập ID người nhận!');
      return;
    }

    this.taskService.assignTask(taskId, assigneeId).subscribe({
      next: () => {
        alert('Giao việc thành công!');
        this.loadTasks();
      },
      error: (err) => alert('Lỗi: Không có quyền hoặc user không tồn tại!')
    });
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
       localStorage.removeItem('username');
    }
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // --- FRIEND MANAGEMENT ---
  loadFriendsData(): void {
    this.friendService.getFriendsList().subscribe({
      next: (friends) => this.friendsList = friends,
      error: (err) => console.error('Error loading friends', err)
    });
    this.friendService.getPendingRequests().subscribe({
      next: (requests) => this.pendingRequests = requests,
      error: (err) => console.error('Error loading pending requests', err)
    });
  }

  openFriendModal(): void {
    this.isFriendModalOpen = true;
    this.friendTab = 'friends';
    this.loadFriendsData();
  }

  closeFriendModal(): void {
    this.isFriendModalOpen = false;
    this.friendSearchQuery = '';
    this.friendSearchResults = [];
  }

  searchFriends(): void {
    if (!this.friendSearchQuery.trim()) {
      this.friendSearchResults = [];
      return;
    }
    this.friendService.searchUsers(this.friendSearchQuery).subscribe({
      next: (users) => this.friendSearchResults = users,
      error: (err) => console.error('Search error', err)
    });
  }

  sendFriendRequest(userId: number): void {
    this.friendService.sendRequest(userId).subscribe({
      next: () => {
        alert('Đã gửi lời mời kết bạn');
        this.searchFriends(); // refresh if needed
      },
      error: (err) => alert('Lỗi: ' + (err.error || 'Có lỗi xảy ra'))
    });
  }

  acceptRequest(id: number): void {
    this.friendService.acceptRequest(id).subscribe({
      next: () => {
        this.loadFriendsData();
      },
      error: (err) => alert('Lỗi: ' + err.error)
    });
  }

  rejectRequest(id: number): void {
    this.friendService.rejectRequest(id).subscribe({
      next: () => {
        this.loadFriendsData();
      },
      error: (err) => alert('Lỗi: ' + err.error)
    });
  }
}