package com.example.demo.tasksystem.repository;

import com.example.demo.tasksystem.entity.Friendship;
import com.example.demo.tasksystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    
    Optional<Friendship> findByRequesterAndReceiver(User requester, User receiver);

    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user OR f.receiver = :user) AND f.status = :status")
    List<Friendship> findFriendshipsByUserAndStatus(@Param("user") User user, @Param("status") String status);

    @Query("SELECT f FROM Friendship f WHERE f.receiver = :user AND f.status = 'PENDING'")
    List<Friendship> findPendingRequestsForUser(@Param("user") User user);
    
    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user1 AND f.receiver = :user2) OR (f.requester = :user2 AND f.receiver = :user1)")
    Optional<Friendship> findAnyFriendshipBetween(@Param("user1") User user1, @Param("user2") User user2);
}