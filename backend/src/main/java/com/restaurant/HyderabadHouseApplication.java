package com.restaurant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HyderabadHouseApplication {

    public static void main(String[] args) {
        SpringApplication.run(HyderabadHouseApplication.class, args);
    }
}
