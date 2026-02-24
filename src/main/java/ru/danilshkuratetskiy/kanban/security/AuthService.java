package ru.danilshkuratetskiy.kanban.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ru.danilshkuratetskiy.kanban.datasource.entity.UserEntity;
import ru.danilshkuratetskiy.kanban.datasource.repository.UserRepository;
import ru.danilshkuratetskiy.kanban.domain.model.UserRole;
import ru.danilshkuratetskiy.kanban.domain.service.exception.EmailAlreadyExistsException;
import ru.danilshkuratetskiy.kanban.domain.service.exception.InvalidTokenException;
import ru.danilshkuratetskiy.kanban.security.dto.JwtAuthentificationDto;
import ru.danilshkuratetskiy.kanban.security.dto.LoginRequest;
import ru.danilshkuratetskiy.kanban.security.dto.RegisterRequest;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public JwtAuthentificationDto register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already in use: " + request.getEmail());
        }

        UserEntity user = new UserEntity();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.DEVELOPER);

        UserEntity saved = userRepository.save(user);

        JwtAuthentificationDto dto = jwtService.generateJwtAuthToken(request.getEmail());
        dto.setRole(UserRole.DEVELOPER.name());
        dto.setUserId(saved.getId().toString());
        return dto;
    }

    public JwtAuthentificationDto login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        JwtAuthentificationDto dto = jwtService.generateJwtAuthToken(request.getEmail());
        userRepository.findByEmail(request.getEmail())
                .ifPresent(u -> {
                    dto.setRole(u.getRole().name());
                    dto.setUserId(u.getId().toString());
                });
        return dto;
    }

    public JwtAuthentificationDto refresh(String refreshToken) {
        if (!jwtService.validateJwtToken(refreshToken)) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }
        String email = jwtService.getEmailFromToken(refreshToken);
        JwtAuthentificationDto dto = jwtService.refreshBaseToken(email, refreshToken);
        userRepository.findByEmail(email)
                .ifPresent(u -> {
                    dto.setRole(u.getRole().name());
                    dto.setUserId(u.getId().toString());
                });
        return dto;
    }
}
