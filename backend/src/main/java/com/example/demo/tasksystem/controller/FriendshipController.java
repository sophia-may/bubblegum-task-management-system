package com.example.demo.tasksystem.controller;

import com.example.demo.tasksystem.dto.FriendshipDto;
import com.example.demo.tasksystem.dto.UserDto;
import com.example.demo.tasksystem.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class FriendshipController {

    private final FriendshipService friendshipService;

    // Lấy tên user đang đăng nhập
    private String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // 1. Tìm user để kết bạn
    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(friendshipService.searchUsers(getCurrentUsername(), query));
    }

    // 2. Gửi lời mời kết bạn
    @PostMapping("/request/{receiverId}")
    public ResponseEntity<String> sendRequest(@PathVariable Long receiverId) {
        try {
            friendshipService.sendFriendRequest(getCurrentUsername(), receiverId);
            return ResponseEntity.ok("Friend request sent!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Lấy danh sách lời mời đang chờ mình duyệt
    @GetMapping("/pending")
    public ResponseEntity<List<FriendshipDto>> getPendingRequests() {
        return ResponseEntity.ok(friendshipService.getPendingRequests(getCurrentUsername()));
    }

    // 4. Lấy danh sách bạn bè đã kết bạn
    @GetMapping("/list")
    public ResponseEntity<List<UserDto>> getFriendsList() {
        return ResponseEntity.ok(friendshipService.getFriends(getCurrentUsername()));
    }

    // 5. Đồng ý kết bạn
    @PostMapping("/accept/{friendshipId}")
    public ResponseEntity<String> acceptRequest(@PathVariable Long friendshipId) {
        try {
            friendshipService.acceptFriendRequest(getCurrentUsername(), friendshipId);
            return ResponseEntity.ok("Friend request accepted!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 6. Từ chối kết bạn
    @PostMapping("/reject/{friendshipId}")
    public ResponseEntity<String> rejectRequest(@PathVariable Long friendshipId) {
        try {
            friendshipService.rejectFriendRequest(getCurrentUsername(), friendshipId);
            return ResponseEntity.ok("Friend request rejected!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}