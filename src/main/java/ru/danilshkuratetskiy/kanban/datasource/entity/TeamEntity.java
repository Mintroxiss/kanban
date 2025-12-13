package ru.danilshkuratetskiy.kanban.datasource.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "teams")
public class TeamEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "direction_id", nullable = false)
    private UUID directionId;

    @Column(name = "team_lead_id")
    private UUID teamLeadId;
}
