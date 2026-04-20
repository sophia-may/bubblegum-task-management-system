package com.example.demo.tasksystem.service;

import com.example.demo.tasksystem.dto.TaskRequest;
import com.example.demo.tasksystem.dto.TaskResponse;
import com.example.demo.tasksystem.entity.Task;
import com.example.demo.tasksystem.entity.User;
import com.example.demo.tasksystem.repository.TaskRepository;
import com.example.demo.tasksystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    // 1. Tạo Task
    public TaskResponse createTask(TaskRequest request, String username) {
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .deadline(request.getDeadline())
                .creator(creator)
                .assignee(assignee)
                .status("TODO") // Mặc định khi tạo mới
                .build();

        taskRepository.save(task);
        return mapToResponse(task);
    }

    // 2. Lấy danh sách Task liên quan đến User
    public List<TaskResponse> getMyTasks(String username) {
        // Lấy task mình tạo
        List<Task> myTasks = taskRepository.findByCreatorUsername(username);
        // Lấy task mình được giao
        List<Task> assignedTasks = taskRepository.findByAssigneeUsername(username);
        
        // Gộp lại và loại bỏ trùng lặp (nếu tự giao cho mình)
        myTasks.removeAll(assignedTasks);
        myTasks.addAll(assignedTasks);

        return myTasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // 3. Cập nhật trạng thái
    public TaskResponse updateStatus(Long taskId, String newStatus) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setStatus(newStatus);
        taskRepository.save(task);
        return mapToResponse(task);
    }

    // 4. Giao việc (Assign task)
    public TaskResponse assignTask(Long taskId, Long assigneeId, String currentUser) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User assigner = userRepository.findByUsername(currentUser)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Chỉ người tạo hoặc Admin mới được assign
        if (!task.getCreator().getId().equals(assigner.getId()) && !assigner.getRole().equals("ROLE_ADMIN")) {
            throw new RuntimeException("You do not have permission to assign this task");
        }

        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new RuntimeException("Assignee not found"));

        task.setAssignee(assignee);
        taskRepository.save(task);
        return mapToResponse(task);
    }

    // Hàm phụ trợ map Entity -> DTO
    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .deadline(task.getDeadline())
                .status(task.getStatus())
                .creatorUsername(task.getCreator().getUsername())
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .assigneeUsername(task.getAssignee() != null ? task.getAssignee().getUsername() : null)
                .createdAt(task.getCreatedAt())
                .build();
    }
}
