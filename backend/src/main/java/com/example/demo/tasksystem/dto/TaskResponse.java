package com.example.demo.tasksystem.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime deadline;
    private String status;
    private String creatorUsername;
    private Long assigneeId;
    private String assigneeUsername;
    private LocalDateTime createdAt;
}
