package ru.danilshkuratetskiy.kanban.datasource.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(
        name = "epics",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"board_id", "title"})
        }
)
public class EpicEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(name = "board_id", nullable = false)
    private UUID boardId;
}
