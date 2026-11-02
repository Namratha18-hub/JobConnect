
package com.jobconnect.jobconnect_backend;

import java.util.Scanner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {

    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter your new Admin password: ");
        String password = scanner.nextLine();

        if (password.length() < 12) {
            System.out.println("Use at least 12 characters.");
            return;
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String hashedPassword = encoder.encode(password);

        System.out.println("\nYour BCrypt password hash:");
        System.out.println(hashedPassword);
    }
}
