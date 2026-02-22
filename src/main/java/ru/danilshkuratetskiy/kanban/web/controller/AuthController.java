package ru.danilshkuratetskiy.kanban.web.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.danilshkuratetskiy.kanban.security.AuthService;
import ru.danilshkuratetskiy.kanban.security.dto.JwtAuthentificationDto;
import ru.danilshkuratetskiy.kanban.security.dto.LoginRequest;
import ru.danilshkuratetskiy.kanban.security.dto.RefreshTokenDto;
import ru.danilshkuratetskiy.kanban.security.dto.RegisterRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public JwtAuthentificationDto register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public JwtAuthentificationDto login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public JwtAuthentificationDto refresh(@Valid @RequestBody RefreshTokenDto request) {
        return authService.refresh(request.getRefreshToken());
    }
}
