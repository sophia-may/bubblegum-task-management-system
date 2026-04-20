package com.example.demo.tasksystem.controller;

import com.example.demo.tasksystem.dto.TaskRequest;
import com.example.demo.tasksystem.dto.TaskResponse;
import com.example.demo.tasksystem.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@RequestBody TaskRequest request, Principal principal) {
        // principal.getName() sẽ lấy ra username từ JWT Token
        return ResponseEntity.ok(taskService.createTask(request, principal.getName()));
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getMyTasks(Principal principal) {
        return ResponseEntity.ok(taskService.getMyTasks(principal.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(taskService.updateStatus(id, status));
    }

    @PatchMapping("/{id}/assign/{assigneeId}")
    public ResponseEntity<TaskResponse> assignTask(
            @PathVariable Long id, 
            @PathVariable Long assigneeId, 
            Principal principal) {
        return ResponseEntity.ok(taskService.assignTask(id, assigneeId, principal.getName()));
    }
}