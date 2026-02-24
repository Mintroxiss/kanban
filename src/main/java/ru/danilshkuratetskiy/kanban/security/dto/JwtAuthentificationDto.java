package ru.danilshkuratetskiy.kanban.security.dto;

import lombok.Data;

@Data
public class JwtAuthentificationDto {
    private String token;
    private String refreshToken;
    private String role;
    private String userId;
}
