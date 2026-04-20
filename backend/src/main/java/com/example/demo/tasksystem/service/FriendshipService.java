package com.example.demo.tasksystem.service;

import com.example.demo.tasksystem.dto.FriendshipDto;
import com.example.demo.tasksystem.dto.UserDto;
import com.example.demo.tasksystem.entity.Friendship;
import com.example.demo.tasksystem.entity.User;
import com.example.demo.tasksystem.repository.FriendshipRepository;
import com.example.demo.tasksystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.text.Normalizer;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    // Lấy thông tin user an toàn (ko lộ pass)
    private UserDto mapToUserDto(User user) {
        return UserDto.builder().id(user.getId()).username(user.getUsername()).build();
    }

    private FriendshipDto mapToFriendshipDto(Friendship f) {
        return FriendshipDto.builder()
                .id(f.getId())
                .requester(mapToUserDto(f.getRequester()))
                .receiver(mapToUserDto(f.getReceiver()))
                .status(f.getStatus())
                .createdAt(f.getCreatedAt())
                .build();
    }

    public List<UserDto> getFriends(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername).orElseThrow();
        List<Friendship> friendships = friendshipRepository.findFriendshipsByUserAndStatus(user, "ACCEPTED");
        
        return friendships.stream().map(f -> {
            User friend = f.getRequester().equals(user) ? f.getReceiver() : f.getRequester();
            return mapToUserDto(friend);
        }).collect(Collectors.toList());
    }

    public List<FriendshipDto> getPendingRequests(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername).orElseThrow();
        return friendshipRepository.findPendingRequestsForUser(user)
                .stream().map(this::mapToFriendshipDto)
                .collect(Collectors.toList());
    }

    public void sendFriendRequest(String currentUsername, Long receiverId) {
        User requester = userRepository.findByUsername(currentUsername).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (requester.getId().equals(receiver.getId())) {
            throw new RuntimeException("Cannot send friend request to yourself");
        }

        Optional<Friendship> existing = friendshipRepository.findAnyFriendshipBetween(requester, receiver);
        if (existing.isPresent()) {
            throw new RuntimeException("Friendship or request already exists");
        }

        Friendship friendship = Friendship.builder()
                .requester(requester)
                .receiver(receiver)
                .status("PENDING")
                .build();
        friendshipRepository.save(friendship);
    }

    public void acceptFriendRequest(String currentUsername, Long friendshipId) {
        User receiver = userRepository.findByUsername(currentUsername).orElseThrow();
        Friendship friendship = friendshipRepository.findById(friendshipId).orElseThrow(() -> new RuntimeException("Request not found"));

        if (!friendship.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        friendship.setStatus("ACCEPTED");
        friendshipRepository.save(friendship);
    }
    
    public void rejectFriendRequest(String currentUsername, Long friendshipId) {
        User receiver = userRepository.findByUsername(currentUsername).orElseThrow();
        Friendship friendship = friendshipRepository.findById(friendshipId).orElseThrow(() -> new RuntimeException("Request not found"));

        if (!friendship.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        friendshipRepository.delete(friendship);
    }

    public List<UserDto> searchUsers(String currentUsername, String query) {
        User currentUser = userRepository.findByUsername(currentUsername).orElseThrow();
        String normalizedQuery = normalizeText(query);

        if (normalizedQuery.isEmpty()) {
            return List.of();
        }

        Set<Long> excludedUserIds = friendshipRepository.findFriendshipsByUserAndStatus(currentUser, "PENDING").stream()
            .map(friendship -> friendship.getRequester().getId().equals(currentUser.getId())
                ? friendship.getReceiver().getId()
                : friendship.getRequester().getId())
            .collect(Collectors.toSet());

        excludedUserIds.addAll(friendshipRepository.findFriendshipsByUserAndStatus(currentUser, "ACCEPTED").stream()
            .map(friendship -> friendship.getRequester().getId().equals(currentUser.getId())
                ? friendship.getReceiver().getId()
                : friendship.getRequester().getId())
            .collect(Collectors.toSet()));
        excludedUserIds.add(currentUser.getId());

        return userRepository.findAll().stream()
            .filter(user -> user.getUsername() != null)
                .filter(user -> normalizeText(user.getUsername()).contains(normalizedQuery))
            .filter(user -> !excludedUserIds.contains(user.getId()))
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }

        String trimmed = value.trim().toLowerCase();
        String normalized = Normalizer.normalize(trimmed, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}+", "");
    }
}