package com.example.demo.tasksystem.controller;

import com.example.demo.tasksystem.dto.AuthRequest;
import com.example.demo.tasksystem.dto.AuthResponse;
import com.example.demo.tasksystem.entity.User;
import com.example.demo.tasksystem.repository.UserRepository;
import com.example.demo.tasksystem.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER") // Mặc định là user
                .build();
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(user -> isPasswordValid(request.getPassword(), user))
                .map(user -> {
                    String token = jwtService.generateToken(user);
                    return ResponseEntity.ok(new AuthResponse(token));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    private boolean isPasswordValid(String rawPassword, User user) {
        if (passwordEncoder.matches(rawPassword, user.getPassword())) {
            return true;
        }

        // Backward compatibility: migrate old plaintext passwords on successful login.
        if (rawPassword.equals(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            return true;
        }

        return false;
    }
}