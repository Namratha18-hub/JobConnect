
package com.jobconnect.jobconnect_backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log =
            LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean emailEnabled;
    private final String fromEmail;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${jobconnect.email.enabled:false}")
            boolean emailEnabled,
            @Value("${spring.mail.username:}")
            String fromEmail) {

        this.mailSenderProvider = mailSenderProvider;
        this.emailEnabled = emailEnabled;
        this.fromEmail = fromEmail;
    }

    public void sendNotificationEmail(
            String recipient,
            String subject,
            String body) {

        if (!emailEnabled) {
            log.debug("Email notifications are disabled.");
            return;
        }

        if (recipient == null || recipient.isBlank()) {
            log.warn("Email skipped: recipient address is missing.");
            return;
        }

        if (fromEmail == null || fromEmail.isBlank()) {
            log.warn("Email skipped: SMTP sender address is missing.");
            return;
        }

        try {
            JavaMailSender mailSender =
                    mailSenderProvider.getIfAvailable();

            if (mailSender == null) {
                log.warn("SMTP mail sender is not configured.");
                return;
            }

            SimpleMailMessage message =
                    new SimpleMailMessage();

            message.setFrom(fromEmail);
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            log.info("Notification email sent to {}", recipient);

        } catch (MailException exception) {
            log.error(
                    "Failed to send email to {}: {}",
                    recipient,
                    exception.getMessage()
            );
        }
    }
}
