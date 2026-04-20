package com.example.demo.tasksystem.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TaskRequest {
    private String title;
    private String description;
    private LocalDateTime deadline;
    private Long assigneeId;
}