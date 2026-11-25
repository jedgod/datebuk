"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Lock,
  Eye,
  Volume2,
  Shield,
  Zap,
  Moon,
  Download,
  AlertCircle,
  X,
  Mail,
  Smartphone,
  Eye as EyeIcon,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/stores/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { EnterpriseSidebar } from "@/components/dashboard/EnterpriseSidebar";
import { MobileEnterpriseDrawer } from "@/components/dashboard/MobileEnterpriseDrawer";

const LADY_IMAGES = [
  '0c7635a9-7e11-482f-836f-8b80072abb9f.jpeg', '1184964461296391037.jpeg', '123_1.jpeg', '167f0183-df8d-4147-b797-db909a5b987e.jpeg', '3d1d2ff8-783a-42fc-8bd7-cd31805ffebe.jpeg',
];

// Comprehensive translations for all supported languages
const TRANSLATIONS = {
  en: {
    // Sidebar
    settings: "⚙️ Settings",
    manage_account: "Manage your account",
    back_to_matches: "Back to Matches",
    delete_account: "Delete Account",
    
    // Categories
    account_security: "Account & Security",
    privacy_visibility: "Privacy & Visibility",
    notifications: "Notifications & Communication",
    matches_interactions: "Matches & Interactions",
    subscription_payments: "Subscription & Payments",
    appearance_accessibility: "Appearance & Accessibility",
    help_support: "Help & Support",
    
    // Account & Security items
    edit_profile: "Edit Profile",
    dating_preferences: "Dating Preferences",
    password_2fa: "Password & 2FA",
    verification: "Verification",
    
    // Privacy & Visibility items
    privacy_controls: "Privacy Controls",
    photo_privacy: "Photo Privacy",
    show_hide_profile: "Show/Hide Profile",
    
    // Notifications items
    push_notifications: "Push Notifications",
    email_notifications: "Email Notifications",
    message_notifications: "Message Notifications",
    read_receipts: "Read Receipts",
    
    // Matches & Interactions items
    blocked_users: "Blocked Users",
    match_history: "Match History",
    reported_users: "Reported Users",
    
    // Subscription & Payments items
    my_subscription: "My Subscription",
    billing_history: "Billing History",
    payment_methods: "Payment Methods",
    
    // Appearance & Accessibility items
    dark_mode: "Dark Mode",
    language: "Language",
    text_size: "Text Size",
    
    // Help & Support items
    help_faq: "Help / FAQ",
    contact_support: "Contact Support",
    safety_tips: "Safety Tips",
    about_terms: "About / Terms",
    
    // Modals - Edit Profile
    edit_profile_title: "Edit Profile",
    display_name: "Display Name",
    display_name_placeholder: "Enter your name",
    bio: "Bio",
    bio_placeholder: "Write something about yourself...",
    age: "Age",
    age_placeholder: "26",
    height: "Height",
    height_placeholder: "5'8\"",
    job_title: "Job Title",
    job_placeholder: "Software Engineer",
    education: "Education",
    education_placeholder: "Bachelor's Degree",
    save_changes: "Save Changes",
    profile_updated: "Profile updated successfully!",
    
    // Privacy Settings Modal
    privacy_controls_title: "Privacy Controls",
    who_can_see: "Who can see your profile?",
    public: "Public",
    matches_only: "Matches Only",
    hidden: "Hidden",
    hide_age: "Hide Age",
    hide_distance: "Hide Distance",
    save_settings: "Save Settings",
    privacy_saved: "Privacy settings saved!",
    
    // Password & Security Modal
    password_security_title: "Password & Security",
    two_factor_auth: "🔐 Two-Factor Authentication",
    two_factor_desc: "Add an extra layer of security to your account.",
    enable_2fa: "Enable 2FA",
    current_password: "Current Password",
    new_password: "New Password",
    confirm_password: "Confirm Password",
    update_security: "Update Security",
    security_updated: "Security settings updated!",
    
    // Verification Modal
    verification_title: "Account Verification",
    verification_status: "✓ Verification Status",
    current_level: "Current level:",
    photo_verification: "📸 Photo Verification",
    photo_verification_desc: "Verify with a selfie",
    phone_verification: "📱 Phone Verification",
    phone_verification_desc: "Verify with your phone number",
    email_verification: "✉️ Email Verification",
    email_verification_desc: "Verify your email address",
    close: "Close",
    
    // Photo Privacy Modal
    photo_privacy_title: "Photo Privacy",
    hide_photos_profile: "Hide photos from profile",
    only_show_matches: "Only show to matches",
    privacy_tip: "💡 Tip: Hide photos to increase your privacy. They'll only be visible to people you've connected with.",
    
    // Show/Hide Profile Modal
    profile_visibility_title: "Profile Visibility",
    current_status: "Current Status:",
    visible_status: "VISIBLE",
    hidden_status: "HIDDEN",
    show_my_profile: "Show My Profile",
    visible_all_users: "Visible to all users",
    hide_my_profile: "Hide My Profile",
    visible_matches_only: "Only visible to matches",
    update_visibility: "Update Visibility",
    profile_shown: "Profile shown!",
    profile_hidden: "Profile hidden!",
    
    // Dating Preferences Modal
    dating_preferences_title: "Dating Preferences",
    age_range: "Age Range:",
    min_age: "Min age",
    max_age: "Max age",
    distance: "Distance:",
    km: "km",
    save_preferences: "Save Preferences",
    preferences_saved: "Dating preferences saved!",
    
    // Blocked Users Modal
    blocked_users_title: "Blocked Users",
    unblock: "Unblock",
    
    // Match History Modal
    match_history_title: "Match History",
    
    // Delete Account Modal
    delete_account_title: "Delete Account",
    permanent_warning: "⚠️ This is permanent",
    permanent_desc: "All your data will be deleted and cannot be recovered.",
    confirm_email: "Confirm by typing your email",
    cancel: "Cancel",
    
    // My Subscription Modal
    subscription_title: "My Subscription",
    current_plan: "Current Plan",
    expires: "Expires on:",
    premium_plan: "Premium Plan",
    gold_plan: "Gold Plan",
    plus_plan: "Plus Plan",
    update_subscription: "Update Subscription",
    subscription_updated: "Subscription updated!",
    
    // Billing History Modal
    billing_history_title: "Billing History",
    download: "Download",
    
    // Payment Methods Modal
    payment_methods_title: "Payment Methods",
    default: "DEFAULT",
    visa: "💳 Visa",
    mastercard: "💳 Mastercard",
    remove: "Remove",
    add_payment: "+ Add Payment Method",
    payment_saved: "Payment methods updated!",
    
    // Language Settings Modal
    language_title: "Language Settings",
    english: "English",
    spanish: "Spanish",
    french: "French",
    german: "German",
    chinese: "Chinese",
    japanese: "Japanese",
    save_language: "Save Language",
    language_set: "Language set to",
    
    // Text Size Modal
    text_size_title: "Text Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    extra_large: "Extra Large",
    preview: "Preview of text size",
    save_text_size: "Save Text Size",
    text_size_set: "Text size set to",
    
    // Main content
    select_category: "Select a category to view settings",
    help_center: "Help center opened",
    support_form: "Support form opened",
    safety_guidelines: "Safety guidelines opened",
    terms_conditions: "Terms and conditions opened",
    unblocked: "unblocked",
    enabled: "enabled",
    disabled: "disabled",
    reported_list: "Reported users list opened",
  },
  
  fr: {
    // Sidebar
    settings: "⚙️ Paramètres",
    manage_account: "Gérer votre compte",
    back_to_matches: "Retour aux correspondances",
    delete_account: "Supprimer le compte",
    
    // Categories
    account_security: "Compte et sécurité",
    privacy_visibility: "Confidentialité et visibilité",
    notifications: "Notifications et communication",
    matches_interactions: "Correspondances et interactions",
    subscription_payments: "Abonnement et paiements",
    appearance_accessibility: "Apparence et accessibilité",
    help_support: "Aide et support",
    
    // Account & Security items
    edit_profile: "Modifier le profil",
    dating_preferences: "Préférences de rencontre",
    password_2fa: "Mot de passe et 2FA",
    verification: "Vérification",
    
    // Privacy & Visibility items
    privacy_controls: "Contrôles de confidentialité",
    photo_privacy: "Confidentialité des photos",
    show_hide_profile: "Afficher/Masquer le profil",
    
    // Notifications items
    push_notifications: "Notifications push",
    email_notifications: "Notifications par email",
    message_notifications: "Notifications de message",
    read_receipts: "Accusés de réception de lecture",
    
    // Matches & Interactions items
    blocked_users: "Utilisateurs bloqués",
    match_history: "Historique des correspondances",
    reported_users: "Utilisateurs signalés",
    
    // Subscription & Payments items
    my_subscription: "Mon abonnement",
    billing_history: "Historique de facturation",
    payment_methods: "Moyens de paiement",
    
    // Appearance & Accessibility items
    dark_mode: "Mode sombre",
    language: "Langue",
    text_size: "Taille du texte",
    
    // Help & Support items
    help_faq: "Aide / FAQ",
    contact_support: "Contacter le support",
    safety_tips: "Conseils de sécurité",
    about_terms: "À propos / Conditions",
    
    // Modals - Edit Profile
    edit_profile_title: "Modifier le profil",
    display_name: "Nom d'affichage",
    display_name_placeholder: "Entrez votre nom",
    bio: "Biographie",
    bio_placeholder: "Écrivez quelque chose sur vous...",
    age: "Âge",
    age_placeholder: "26",
    height: "Taille",
    height_placeholder: "1,73 m",
    job_title: "Titre du poste",
    job_placeholder: "Ingénieur logiciel",
    education: "Éducation",
    education_placeholder: "Diplôme universitaire",
    save_changes: "Enregistrer les modifications",
    profile_updated: "Profil mis à jour avec succès!",
    
    // Privacy Settings Modal
    privacy_controls_title: "Contrôles de confidentialité",
    who_can_see: "Qui peut voir votre profil?",
    public: "Public",
    matches_only: "Correspondances uniquement",
    hidden: "Masqué",
    hide_age: "Masquer l'âge",
    hide_distance: "Masquer la distance",
    save_settings: "Enregistrer les paramètres",
    privacy_saved: "Paramètres de confidentialité enregistrés!",
    
    // Password & Security Modal
    password_security_title: "Mot de passe et sécurité",
    two_factor_auth: "🔐 Authentification à deux facteurs",
    two_factor_desc: "Ajoutez une couche supplémentaire de sécurité à votre compte.",
    enable_2fa: "Activer 2FA",
    current_password: "Mot de passe actuel",
    new_password: "Nouveau mot de passe",
    confirm_password: "Confirmer le mot de passe",
    update_security: "Mettre à jour la sécurité",
    security_updated: "Paramètres de sécurité mis à jour!",
    
    // Verification Modal
    verification_title: "Vérification du compte",
    verification_status: "✓ État de vérification",
    current_level: "Niveau actuel:",
    photo_verification: "📸 Vérification par photo",
    photo_verification_desc: "Vérifier avec un selfie",
    phone_verification: "📱 Vérification par téléphone",
    phone_verification_desc: "Vérifier avec votre numéro de téléphone",
    email_verification: "✉️ Vérification par email",
    email_verification_desc: "Vérifier votre adresse email",
    close: "Fermer",
    
    // Photo Privacy Modal
    photo_privacy_title: "Confidentialité des photos",
    hide_photos_profile: "Masquer les photos du profil",
    only_show_matches: "Afficher uniquement aux correspondances",
    privacy_tip: "💡 Conseil: Masquez les photos pour augmenter votre confidentialité. Elles ne seront visibles que par les personnes avec lesquelles vous vous êtes connecté.",
    
    // Show/Hide Profile Modal
    profile_visibility_title: "Visibilité du profil",
    current_status: "État actuel:",
    visible_status: "VISIBLE",
    hidden_status: "MASQUÉ",
    show_my_profile: "Afficher mon profil",
    visible_all_users: "Visible par tous les utilisateurs",
    hide_my_profile: "Masquer mon profil",
    visible_matches_only: "Visible uniquement aux correspondances",
    update_visibility: "Mettre à jour la visibilité",
    profile_shown: "Profil affiché!",
    profile_hidden: "Profil masqué!",
    
    // Dating Preferences Modal
    dating_preferences_title: "Préférences de rencontre",
    age_range: "Plage d'âge:",
    min_age: "Âge minimum",
    max_age: "Âge maximum",
    distance: "Distance:",
    km: "km",
    save_preferences: "Enregistrer les préférences",
    preferences_saved: "Préférences de rencontre enregistrées!",
    
    // Blocked Users Modal
    blocked_users_title: "Utilisateurs bloqués",
    unblock: "Débloquer",
    
    // Match History Modal
    match_history_title: "Historique des correspondances",
    
    // Delete Account Modal
    delete_account_title: "Supprimer le compte",
    permanent_warning: "⚠️ C'est permanent",
    permanent_desc: "Toutes vos données seront supprimées et ne peuvent pas être récupérées.",
    confirm_email: "Confirmez en tapant votre email",
    cancel: "Annuler",
    
    // My Subscription Modal
    subscription_title: "Mon abonnement",
    current_plan: "Plan actuel",
    expires: "Expire le:",
    premium_plan: "Plan Premium",
    gold_plan: "Plan Gold",
    plus_plan: "Plan Plus",
    update_subscription: "Mettre à jour l'abonnement",
    subscription_updated: "Abonnement mis à jour!",
    
    // Billing History Modal
    billing_history_title: "Historique de facturation",
    download: "Télécharger",
    
    // Payment Methods Modal
    payment_methods_title: "Moyens de paiement",
    default: "PAR DÉFAUT",
    visa: "💳 Visa",
    mastercard: "💳 Mastercard",
    remove: "Supprimer",
    add_payment: "+ Ajouter un moyen de paiement",
    payment_saved: "Moyens de paiement mis à jour!",
    
    // Language Settings Modal
    language_title: "Paramètres de langue",
    english: "Anglais",
    spanish: "Espagnol",
    french: "Français",
    german: "Allemand",
    chinese: "Chinois",
    japanese: "Japonais",
    save_language: "Enregistrer la langue",
    language_set: "Langue définie sur",
    
    // Text Size Modal
    text_size_title: "Taille du texte",
    small: "Petit",
    medium: "Moyen",
    large: "Grand",
    extra_large: "Extra grand",
    preview: "Aperçu de la taille du texte",
    save_text_size: "Enregistrer la taille du texte",
    text_size_set: "Taille du texte définie sur",
    
    // Main content
    select_category: "Sélectionnez une catégorie pour afficher les paramètres",
    help_center: "Centre d'aide ouvert",
    support_form: "Formulaire de support ouvert",
    safety_guidelines: "Directives de sécurité ouvertes",
    terms_conditions: "Conditions générales ouvertes",
    unblocked: "débloqué",
    enabled: "activé",
    disabled: "désactivé",
    reported_list: "Liste des utilisateurs signalés ouvert",
  },

  es: {
    settings: "⚙️ Configuración",
    manage_account: "Administrar tu cuenta",
    back_to_matches: "Volver a las coincidencias",
    delete_account: "Eliminar cuenta",
    account_security: "Cuenta y seguridad",
    privacy_visibility: "Privacidad y visibilidad",
    notifications: "Notificaciones y comunicación",
    matches_interactions: "Coincidencias e interacciones",
    subscription_payments: "Suscripción y pagos",
    appearance_accessibility: "Apariencia y accesibilidad",
    help_support: "Ayuda y soporte",
    edit_profile: "Editar perfil",
    dating_preferences: "Preferencias de citas",
    password_2fa: "Contraseña y 2FA",
    verification: "Verificación",
    privacy_controls: "Controles de privacidad",
    photo_privacy: "Privacidad de fotos",
    show_hide_profile: "Mostrar/Ocultar perfil",
    push_notifications: "Notificaciones push",
    email_notifications: "Notificaciones por correo",
    message_notifications: "Notificaciones de mensajes",
    read_receipts: "Confirmaciones de lectura",
    blocked_users: "Usuarios bloqueados",
    match_history: "Historial de coincidencias",
    reported_users: "Usuarios reportados",
    my_subscription: "Mi suscripción",
    billing_history: "Historial de facturación",
    payment_methods: "Métodos de pago",
    dark_mode: "Modo oscuro",
    language: "Idioma",
    text_size: "Tamaño de texto",
    help_faq: "Ayuda / Preguntas frecuentes",
    contact_support: "Contactar soporte",
    safety_tips: "Consejos de seguridad",
    about_terms: "Acerca de / Términos",
    edit_profile_title: "Editar perfil",
    display_name: "Nombre",
    display_name_placeholder: "Ingresa tu nombre",
    bio: "Biografía",
    bio_placeholder: "Escribe algo sobre ti...",
    age: "Edad",
    age_placeholder: "26",
    height: "Altura",
    height_placeholder: "5'8\"",
    job_title: "Título del trabajo",
    job_placeholder: "Ingeniero de software",
    education: "Educación",
    education_placeholder: "Licenciatura",
    save_changes: "Guardar cambios",
    profile_updated: "¡Perfil actualizado exitosamente!",
    privacy_controls_title: "Controles de privacidad",
    who_can_see: "¿Quién puede ver tu perfil?",
    public: "Público",
    matches_only: "Solo coincidencias",
    hidden: "Oculto",
    hide_age: "Ocultar edad",
    hide_distance: "Ocultar distancia",
    save_settings: "Guardar configuración",
    privacy_saved: "¡Configuración de privacidad guardada!",
    password_security_title: "Contraseña y seguridad",
    two_factor_auth: "🔐 Autenticación de dos factores",
    two_factor_desc: "Agrega una capa adicional de seguridad a tu cuenta.",
    enable_2fa: "Habilitar 2FA",
    current_password: "Contraseña actual",
    new_password: "Nueva contraseña",
    confirm_password: "Confirmar contraseña",
    update_security: "Actualizar seguridad",
    security_updated: "¡Configuración de seguridad actualizada!",
    verification_title: "Verificación de cuenta",
    verification_status: "✓ Estado de verificación",
    current_level: "Nivel actual:",
    photo_verification: "📸 Verificación por foto",
    photo_verification_desc: "Verificar con una selfie",
    phone_verification: "📱 Verificación por teléfono",
    phone_verification_desc: "Verificar con tu número de teléfono",
    email_verification: "✉️ Verificación por email",
    email_verification_desc: "Verifica tu dirección de correo",
    close: "Cerrar",
    photo_privacy_title: "Privacidad de fotos",
    hide_photos_profile: "Ocultar fotos del perfil",
    only_show_matches: "Mostrar solo a coincidencias",
    privacy_tip: "💡 Consejo: Oculta fotos para aumentar tu privacidad. Solo serán visibles para personas con las que te hayas conectado.",
    profile_visibility_title: "Visibilidad del perfil",
    current_status: "Estado actual:",
    visible_status: "VISIBLE",
    hidden_status: "OCULTO",
    show_my_profile: "Mostrar mi perfil",
    visible_all_users: "Visible para todos los usuarios",
    hide_my_profile: "Ocultar mi perfil",
    visible_matches_only: "Solo visible para coincidencias",
    update_visibility: "Actualizar visibilidad",
    profile_shown: "¡Perfil mostrado!",
    profile_hidden: "¡Perfil oculto!",
    dating_preferences_title: "Preferencias de citas",
    age_range: "Rango de edad:",
    min_age: "Edad mínima",
    max_age: "Edad máxima",
    distance: "Distancia:",
    km: "km",
    save_preferences: "Guardar preferencias",
    preferences_saved: "¡Preferencias de citas guardadas!",
    blocked_users_title: "Usuarios bloqueados",
    unblock: "Desbloquear",
    match_history_title: "Historial de coincidencias",
    delete_account_title: "Eliminar cuenta",
    permanent_warning: "⚠️ Esto es permanente",
    permanent_desc: "Todos tus datos serán eliminados y no se pueden recuperar.",
    confirm_email: "Confirma escribiendo tu correo",
    cancel: "Cancelar",
    subscription_title: "Mi suscripción",
    current_plan: "Plan actual",
    expires: "Vence el:",
    premium_plan: "Plan Premium",
    gold_plan: "Plan Gold",
    plus_plan: "Plan Plus",
    update_subscription: "Actualizar suscripción",
    subscription_updated: "¡Suscripción actualizada!",
    billing_history_title: "Historial de facturación",
    download: "Descargar",
    payment_methods_title: "Métodos de pago",
    default: "PREDETERMINADO",
    visa: "💳 Visa",
    mastercard: "💳 Mastercard",
    remove: "Eliminar",
    add_payment: "+ Agregar método de pago",
    payment_saved: "¡Métodos de pago actualizados!",
    language_title: "Configuración de idioma",
    english: "Inglés",
    spanish: "Español",
    french: "Francés",
    german: "Alemán",
    chinese: "Chino",
    japanese: "Japonés",
    save_language: "Guardar idioma",
    language_set: "Idioma establecido en",
    text_size_title: "Tamaño de texto",
    small: "Pequeño",
    medium: "Medio",
    large: "Grande",
    extra_large: "Extra grande",
    preview: "Vista previa del tamaño del texto",
    save_text_size: "Guardar tamaño de texto",
    text_size_set: "Tamaño de texto establecido en",
    select_category: "Selecciona una categoría para ver la configuración",
    help_center: "Centro de ayuda abierto",
    support_form: "Formulario de soporte abierto",
    safety_guidelines: "Directrices de seguridad abiertas",
    terms_conditions: "Términos y condiciones abiertos",
    unblocked: "desbloqueado",
    enabled: "habilitado",
    disabled: "deshabilitado",
    reported_list: "Lista de usuarios reportados abierta",
  },

  de: {
    settings: "⚙️ Einstellungen",
    manage_account: "Verwalten Sie Ihr Konto",
    back_to_matches: "Zurück zu Übereinstimmungen",
    delete_account: "Konto löschen",
    account_security: "Konto und Sicherheit",
    privacy_visibility: "Datenschutz und Sichtbarkeit",
    notifications: "Benachrichtigungen und Kommunikation",
    matches_interactions: "Übereinstimmungen und Interaktionen",
    subscription_payments: "Abonnement und Zahlungen",
    appearance_accessibility: "Erscheinungsbild und Barrierefreiheit",
    help_support: "Hilfe und Unterstützung",
    edit_profile: "Profil bearbeiten",
    dating_preferences: "Datierungsvorlieben",
    password_2fa: "Passwort und 2FA",
    verification: "Überprüfung",
    privacy_controls: "Datenschutzkontrollen",
    photo_privacy: "Fotodatenschutz",
    show_hide_profile: "Profil anzeigen/verbergen",
    push_notifications: "Push-Benachrichtigungen",
    email_notifications: "Email-Benachrichtigungen",
    message_notifications: "Nachrichtenbenachrichtigungen",
    read_receipts: "Lesebestätigungen",
    blocked_users: "Blockierte Benutzer",
    match_history: "Übereinstimmungsverlauf",
    reported_users: "Gemeldete Benutzer",
    my_subscription: "Mein Abonnement",
    billing_history: "Abrechnungsverlauf",
    payment_methods: "Zahlungsmethoden",
    dark_mode: "Dunkler Modus",
    language: "Sprache",
    text_size: "Textgröße",
    help_faq: "Hilfe / Häufig gestellte Fragen",
    contact_support: "Kontaktunterstützung",
    safety_tips: "Sicherheitstipps",
    about_terms: "Über / Bedingungen",
    edit_profile_title: "Profil bearbeiten",
    display_name: "Anzeigename",
    display_name_placeholder: "Geben Sie Ihren Namen ein",
    bio: "Biographie",
    bio_placeholder: "Schreiben Sie etwas über sich selbst...",
    age: "Alter",
    age_placeholder: "26",
    height: "Höhe",
    height_placeholder: "1,73 m",
    job_title: "Jobtitel",
    job_placeholder: "Softwareingenieur",
    education: "Ausbildung",
    education_placeholder: "Bachelorabschluss",
    save_changes: "Änderungen speichern",
    profile_updated: "Profil erfolgreich aktualisiert!",
    privacy_controls_title: "Datenschutzkontrollen",
    who_can_see: "Wer kann Ihr Profil sehen?",
    public: "Öffentlich",
    matches_only: "Nur Übereinstimmungen",
    hidden: "Verborgen",
    hide_age: "Alter verbergen",
    hide_distance: "Entfernung verbergen",
    save_settings: "Einstellungen speichern",
    privacy_saved: "Datenschutzeinstellungen gespeichert!",
    password_security_title: "Passwort und Sicherheit",
    two_factor_auth: "🔐 Zwei-Faktor-Authentifizierung",
    two_factor_desc: "Fügen Sie eine zusätzliche Sicherheitsebene zu Ihrem Konto hinzu.",
    enable_2fa: "2FA aktivieren",
    current_password: "Aktuelles Passwort",
    new_password: "Neues Passwort",
    confirm_password: "Passwort bestätigen",
    update_security: "Sicherheit aktualisieren",
    security_updated: "Sicherheitseinstellungen aktualisiert!",
    verification_title: "Kontoüberprüfung",
    verification_status: "✓ Verifizierungsstatus",
    current_level: "Aktuelle Stufe:",
    photo_verification: "📸 Fotoverifizierung",
    photo_verification_desc: "Mit einem Selfie verifizieren",
    phone_verification: "📱 Telefonverifizierung",
    phone_verification_desc: "Mit Ihrer Telefonnummer verifizieren",
    email_verification: "✉️ E-Mail-Verifizierung",
    email_verification_desc: "Überprüfen Sie Ihre E-Mail-Adresse",
    close: "Schließen",
    photo_privacy_title: "Fotodatenschutz",
    hide_photos_profile: "Fotos aus dem Profil verbergen",
    only_show_matches: "Nur Übereinstimmungen anzeigen",
    privacy_tip: "💡 Tipp: Verbergen Sie Fotos, um Ihren Datenschutz zu erhöhen. Sie sind nur für Personen sichtbar, mit denen Sie verbunden sind.",
    profile_visibility_title: "Profilsichtbarkeit",
    current_status: "Aktueller Status:",
    visible_status: "SICHTBAR",
    hidden_status: "VERBORGEN",
    show_my_profile: "Mein Profil anzeigen",
    visible_all_users: "Sichtbar für alle Benutzer",
    hide_my_profile: "Mein Profil verbergen",
    visible_matches_only: "Nur für Übereinstimmungen sichtbar",
    update_visibility: "Sichtbarkeit aktualisieren",
    profile_shown: "Profil angezeigt!",
    profile_hidden: "Profil verborgen!",
    dating_preferences_title: "Datierungsvorlieben",
    age_range: "Altersspanne:",
    min_age: "Mindestalter",
    max_age: "Höchstalter",
    distance: "Entfernung:",
    km: "km",
    save_preferences: "Vorlieben speichern",
    preferences_saved: "Datierungsvorlieben gespeichert!",
    blocked_users_title: "Blockierte Benutzer",
    unblock: "Entsperren",
    match_history_title: "Übereinstimmungsverlauf",
    delete_account_title: "Konto löschen",
    permanent_warning: "⚠️ Dies ist dauerhaft",
    permanent_desc: "Alle Ihre Daten werden gelöscht und können nicht wiederhergestellt werden.",
    confirm_email: "Bestätigen Sie durch Eingabe Ihrer E-Mail",
    cancel: "Abbrechen",
    subscription_title: "Mein Abonnement",
    current_plan: "Aktueller Plan",
    expires: "Verfällt am:",
    premium_plan: "Premium-Plan",
    gold_plan: "Gold-Plan",
    plus_plan: "Plus-Plan",
    update_subscription: "Abonnement aktualisieren",
    subscription_updated: "Abonnement aktualisiert!",
    billing_history_title: "Abrechnungsverlauf",
    download: "Herunterladen",
    payment_methods_title: "Zahlungsmethoden",
    default: "STANDARD",
    visa: "💳 Visa",
    mastercard: "💳 Mastercard",
    remove: "Entfernen",
    add_payment: "+ Zahlungsmethode hinzufügen",
    payment_saved: "Zahlungsmethoden aktualisiert!",
    language_title: "Spracheinstellungen",
    english: "Englisch",
    spanish: "Spanisch",
    french: "Französisch",
    german: "Deutsch",
    chinese: "Chinesisch",
    japanese: "Japanisch",
    save_language: "Sprache speichern",
    language_set: "Sprache eingestellt auf",
    text_size_title: "Textgröße",
    small: "Klein",
    medium: "Mittel",
    large: "Groß",
    extra_large: "Überdimensional",
    preview: "Vorschau der Textgröße",
    save_text_size: "Textgröße speichern",
    text_size_set: "Textgröße eingestellt auf",
    select_category: "Wählen Sie eine Kategorie aus, um die Einstellungen anzuzeigen",
    help_center: "Hilfezentrum geöffnet",
    support_form: "Supportformular geöffnet",
    safety_guidelines: "Sicherheitsrichtlinien geöffnet",
    terms_conditions: "Allgemeine Geschäftsbedingungen geöffnet",
    unblocked: "entsperrt",
    enabled: "aktiviert",
    disabled: "deaktiviert",
    reported_list: "Liste gemeldeter Benutzer geöffnet",
  },

  zh: {
    settings: "⚙️ 设置",
    manage_account: "管理您的帐户",
    back_to_matches: "返回匹配",
    delete_account: "删除帐户",
    account_security: "帐户和安全性",
    privacy_visibility: "隐私和可见性",
    notifications: "通知和沟通",
    matches_interactions: "匹配和交互",
    subscription_payments: "订阅和付款",
    appearance_accessibility: "外观和可访问性",
    help_support: "帮助和支持",
    edit_profile: "编辑资料",
    dating_preferences: "约会偏好",
    password_2fa: "密码和双因素认证",
    verification: "验证",
    privacy_controls: "隐私控制",
    photo_privacy: "照片隐私",
    show_hide_profile: "显示/隐藏资料",
    push_notifications: "推送通知",
    email_notifications: "电子邮件通知",
    message_notifications: "消息通知",
    read_receipts: "已读收据",
    blocked_users: "被阻止的用户",
    match_history: "匹配历史",
    reported_users: "被举报的用户",
    my_subscription: "我的订阅",
    billing_history: "账单历史",
    payment_methods: "付款方式",
    dark_mode: "深色模式",
    language: "语言",
    text_size: "文本大小",
    help_faq: "帮助/常见问题",
    contact_support: "联系支持",
    safety_tips: "安全提示",
    about_terms: "关于/条款",
    edit_profile_title: "编辑资料",
    display_name: "显示名称",
    display_name_placeholder: "输入您的名字",
    bio: "个人简介",
    bio_placeholder: "写一些关于你的东西...",
    age: "年龄",
    age_placeholder: "26",
    height: "身高",
    height_placeholder: "5'8\"",
    job_title: "职位",
    job_placeholder: "软件工程师",
    education: "教育",
    education_placeholder: "学士学位",
    save_changes: "保存更改",
    profile_updated: "资料更新成功！",
    privacy_controls_title: "隐私控制",
    who_can_see: "谁可以看到您的个人资料？",
    public: "公开",
    matches_only: "仅限匹配",
    hidden: "隐藏",
    hide_age: "隐藏年龄",
    hide_distance: "隐藏距离",
    save_settings: "保存设置",
    privacy_saved: "隐私设置已保存！",
    password_security_title: "密码和安全性",
    two_factor_auth: "🔐 双因素认证",
    two_factor_desc: "为您的帐户添加额外的安全层。",
    enable_2fa: "启用双因素认证",
    current_password: "当前密码",
    new_password: "新密码",
    confirm_password: "确认密码",
    update_security: "更新安全性",
    security_updated: "安全设置已更新！",
    verification_title: "账户验证",
    verification_status: "✓ 验证状态",
    current_level: "当前级别:",
    photo_verification: "📸 照片验证",
    photo_verification_desc: "使用自拍验证",
    phone_verification: "📱 电话验证",
    phone_verification_desc: "使用您的电话号码验证",
    email_verification: "✉️ 电子邮件验证",
    email_verification_desc: "验证您的电子邮件地址",
    close: "关闭",
    photo_privacy_title: "照片隐私",
    hide_photos_profile: "隐藏个人资料中的照片",
    only_show_matches: "仅显示到匹配",
    privacy_tip: "💡 提示：隐藏照片以增加您的隐私。它们只会对您已连接的人可见。",
    profile_visibility_title: "资料可见性",
    current_status: "当前状态:",
    visible_status: "可见",
    hidden_status: "隐藏",
    show_my_profile: "显示我的资料",
    visible_all_users: "对所有用户可见",
    hide_my_profile: "隐藏我的资料",
    visible_matches_only: "仅对匹配可见",
    update_visibility: "更新可见性",
    profile_shown: "资料已显示！",
    profile_hidden: "资料已隐藏！",
    dating_preferences_title: "约会偏好",
    age_range: "年龄范围:",
    min_age: "最小年龄",
    max_age: "最大年龄",
    distance: "距离:",
    km: "公里",
    save_preferences: "保存偏好",
    preferences_saved: "约会偏好已保存！",
    blocked_users_title: "被阻止的用户",
    unblock: "解除阻止",
    match_history_title: "匹配历史",
    delete_account_title: "删除帐户",
    permanent_warning: "⚠️ 这是永久的",
    permanent_desc: "您的所有数据将被删除，无法恢复。",
    confirm_email: "通过输入您的电子邮件确认",
    cancel: "取消",
    subscription_title: "我的订阅",
    current_plan: "当前计划",
    expires: "到期日期:",
    premium_plan: "高级计划",
    gold_plan: "黄金计划",
    plus_plan: "Plus计划",
    update_subscription: "更新订阅",
    subscription_updated: "订阅已更新！",
    billing_history_title: "账单历史",
    download: "下载",
    payment_methods_title: "付款方式",
    default: "默认",
    visa: "💳 Visa",
    mastercard: "💳 Mastercard",
    remove: "删除",
    add_payment: "+ 添加付款方式",
    payment_saved: "付款方式已更新！",
    language_title: "语言设置",
    english: "英语",
    spanish: "西班牙语",
    french: "法语",
    german: "德语",
    chinese: "中文",
    japanese: "日语",
    save_language: "保存语言",
    language_set: "语言设置为",
    text_size_title: "文本大小",
    small: "小",
    medium: "中",
    large: "大",
    extra_large: "特大",
    preview: "文本大小预览",
    save_text_size: "保存文本大小",
    text_size_set: "文本大小设置为",
    select_category: "选择一个类别以查看设置",
    help_center: "帮助中心已打开",
    support_form: "支持表单已打开",
    safety_guidelines: "安全指南已打开",
    terms_conditions: "条款和条件已打开",
    unblocked: "已解除阻止",
    enabled: "已启用",
    disabled: "已禁用",
    reported_list: "举报用户列表已打开",
  },

  ja: {
    settings: "⚙️ 設定",
    manage_account: "アカウントを管理",
    back_to_matches: "マッチに戻る",
    delete_account: "アカウントを削除",
    account_security: "アカウントとセキュリティ",
    privacy_visibility: "プライバシーと表示",
    notifications: "通知と通信",
    matches_interactions: "マッチとインタラクション",
    subscription_payments: "サブスクリプションと支払い",
    appearance_accessibility: "外観とアクセシビリティ",
    help_support: "ヘルプとサポート",
    edit_profile: "プロフィールを編集",
    dating_preferences: "デート設定",
    password_2fa: "パスワード＆2FA",
    verification: "認証",
    privacy_controls: "プライバシー制御",
    photo_privacy: "写真プライバシー",
    show_hide_profile: "プロフィールを表示/非表示",
    push_notifications: "プッシュ通知",
    email_notifications: "メール通知",
    message_notifications: "メッセージ通知",
    read_receipts: "既読確認",
    blocked_users: "ブロックされたユーザー",
    match_history: "マッチ履歴",
    reported_users: "報告されたユーザー",
    my_subscription: "私のサブスクリプション",
    billing_history: "請求履歴",
    payment_methods: "支払い方法",
    dark_mode: "ダークモード",
    language: "言語",
    text_size: "テキストサイズ",
    help_faq: "ヘルプ/FAQ",
    contact_support: "サポートに連絡",
    safety_tips: "安全ヒント",
    about_terms: "について/利用規約",
    edit_profile_title: "プロフィールを編集",
    display_name: "表示名",
    display_name_placeholder: "名前を入力",
    bio: "自己紹介",
    bio_placeholder: "自分について何か書いてください...",
    age: "年齢",
    age_placeholder: "26",
    height: "身長",
    height_placeholder: "5'8\"",
    job_title: "職種",
    job_placeholder: "ソフトウェアエンジニア",
    education: "教育",
    education_placeholder: "学士号",
    save_changes: "変更を保存",
    profile_updated: "プロフィールが正常に更新されました！",
    privacy_controls_title: "プライバシー制御",
    who_can_see: "誰がプロフィールを見ることができますか？",
    public: "公開",
    matches_only: "マッチのみ",
    hidden: "隠された",
    hide_age: "年齢を非表示",
    hide_distance: "距離を非表示",
    save_settings: "設定を保存",
    privacy_saved: "プライバシー設定が保存されました！",
    password_security_title: "パスワードとセキュリティ",
    two_factor_auth: "🔐 2要素認証",
    two_factor_desc: "アカウントに追加のセキュリティレイヤーを追加します。",
    enable_2fa: "2FAを有効にする",
    current_password: "現在のパスワード",
    new_password: "新しいパスワード",
    confirm_password: "パスワードを確認",
    update_security: "セキュリティを更新",
    security_updated: "セキュリティ設定が更新されました！",
    verification_title: "アカウント認証",
    verification_status: "✓ 認証ステータス",
    current_level: "現在のレベル:",
    photo_verification: "📸 写真認証",
    photo_verification_desc: "セルフィーで認証",
    phone_verification: "📱 電話認証",
    phone_verification_desc: "電話番号で認証",
    email_verification: "✉️ メール認証",
    email_verification_desc: "メールアドレスを確認",
    close: "閉じる",
    photo_privacy_title: "写真プライバシー",
    hide_photos_profile: "プロフィールから写真を隠す",
    only_show_matches: "マッチのみに表示",
    privacy_tip: "💡 ヒント：プライバシーを高めるために写真を隠してください。接続したユーザーにのみ表示されます。",
    profile_visibility_title: "プロフィール表示",
    current_status: "現在のステータス:",
    visible_status: "表示",
    hidden_status: "隠された",
    show_my_profile: "プロフィールを表示",
    visible_all_users: "すべてのユーザーに表示",
    hide_my_profile: "プロフィールを非表示",
    visible_matches_only: "マッチにのみ表示",
    update_visibility: "表示を更新",
    profile_shown: "プロフィールが表示されました！",
    profile_hidden: "プロフィールが非表示になりました！",
    dating_preferences_title: "デート設定",
    age_range: "年齢範囲:",
    min_age: "最小年齢",
    max_age: "最大年齢",
    distance: "距離:",
    km: "km",
    save_preferences: "設定を保存",
    preferences_saved: "デート設定が保存されました！",
    blocked_users_title: "ブロックされたユーザー",
    unblock: "ブロック解除",
    match_history_title: "マッチ履歴",
    delete_account_title: "アカウントを削除",
    permanent_warning: "⚠️ これは永続的です",
    permanent_desc: "すべてのデータが削除され、復旧することはできません。",
    confirm_email: "メールを入力して確認",
    cancel: "キャンセル",
    subscription_title: "私のサブスクリプション",
    current_plan: "現在のプラン",
    expires: "有効期限:",
    premium_plan: "プレミアムプラン",
    gold_plan: "ゴールドプラン",
    plus_plan: "Plusプラン",
    update_subscription: "サブスクリプションを更新",
    subscription_updated: "サブスクリプションが更新されました！",
    billing_history_title: "請求履歴",
    download: "ダウンロード",
    payment_methods_title: "支払い方法",
    default: "デフォルト",
    visa: "💳 Visa",
    mastercard: "💳 Mastercard",
    remove: "削除",
    add_payment: "+ 支払い方法を追加",
    payment_saved: "支払い方法が更新されました！",
    language_title: "言語設定",
    english: "英語",
    spanish: "スペイン語",
    french: "フランス語",
    german: "ドイツ語",
    chinese: "中国語",
    japanese: "日本語",
    save_language: "言語を保存",
    language_set: "言語が設定されました",
    text_size_title: "テキストサイズ",
    small: "小",
    medium: "中",
    large: "大",
    extra_large: "特大",
    preview: "テキストサイズのプレビュー",
    save_text_size: "テキストサイズを保存",
    text_size_set: "テキストサイズが設定されました",
    select_category: "カテゴリを選択して設定を表示",
    help_center: "ヘルプセンターが開きました",
    support_form: "サポートフォームが開きました",
    safety_guidelines: "安全ガイドラインが開きました",
    terms_conditions: "利用規約が開きました",
    unblocked: "ブロック解除",
    enabled: "有効",
    disabled: "無効",
    reported_list: "報告されたユーザーリストが開きました",
  },
};

// Helper function to translate text
const t = (lang: string, key: keyof typeof TRANSLATIONS.en): string => {
  const translations = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
  return translations[key] || key;
};

export default function SettingsPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { isAuthenticated } = useRequireAuth('/dashboard/settings');
  const [loggedInUser, setLoggedInUser] = useState({ name: "", displayName: "", avatar: "", email: "" });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const actionTimer = useRef<number | null>(null);

  // Account & Security
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [displayName, setDisplayName] = useState("Sarah");
  const [bio, setBio] = useState("Looking for meaningful connections");
  const [age, setAge] = useState("26");
  const [height, setHeight] = useState("5'6\"");
  const [jobTitle, setJobTitle] = useState("nurse");
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [education, setEducation] = useState("bachelor");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Privacy & Visibility
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<"public" | "matches-only" | "hidden">("public");
  const [hideAge, setHideAge] = useState(false);
  const [hideDistance, setHideDistance] = useState(false);

  // Notifications
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  // Appearance
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  // Account Data
  const [blockedUsers, setBlockedUsers] = useState(3);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  // New feature states
  const [showDatingPreferences, setShowDatingPreferences] = useState(false);
  const [agePreference, setAgePreference] = useState({ min: 20, max: 40 });
  const [distancePreference, setDistancePreference] = useState(50);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationLevel, setVerificationLevel] = useState("unverified");
  const [photoVerified, setPhotoVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState<"photo" | "phone" | "email" | null>(null);
  const [showPhotoPrivacy, setShowPhotoPrivacy] = useState(false);
  const [hidePhotosFromMatches, setHidePhotosFromMatches] = useState(false);
  const [showHideProfile, setShowHideProfile] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [showMatchHistory, setShowMatchHistory] = useState(false);
  const [matchHistory] = useState(["Sarah - Passed", "Emma - Connected", "Jessica - Passed"]);
  
  // Subscription & Payments states
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState("premium");
  const [showBillingHistory, setShowBillingHistory] = useState(false);
  const [billingHistory] = useState(["$14.99 - March 1, 2026", "$14.99 - February 1, 2026", "$14.99 - January 1, 2026"]);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: "Visa", last4: "4242", default: true },
    { id: 2, type: "Mastercard", last4: "8765", default: false },
  ]);
  const [defaultPaymentId, setDefaultPaymentId] = useState(1);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [newCardData, setNewCardData] = useState({ cardNumber: "", cardholderName: "", expiryDate: "", cvv: "" });
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [textSize, setTextSize] = useState("medium");
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showTextSizeSettings, setShowTextSizeSettings] = useState(false);

  // Help & Support states
  const [showHelpFAQ, setShowHelpFAQ] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [showAboutTerms, setShowAboutTerms] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactFormData, setContactFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [faqs] = useState([
    { id: 1, question: "How do I reset my password?", answer: "Go to Settings > Password & 2FA and click 'Update Security'. You'll be prompted to enter your current password and create a new one." },
    { id: 2, question: "How do I block a user?", answer: "Visit Matches & Interactions > Blocked Users. Click 'Manage' to add or remove blocked users from your account." },
    { id: 3, question: "What is 2FA and how do I enable it?", answer: "2FA (Two-Factor Authentication) adds an extra security layer. Enable it in Password & 2FA to verify your identity with a code when logging in." },
    { id: 4, question: "How do I change my profile photo?", answer: "Go to Edit Profile in Account & Security and upload a new photo. Your new photo will be visible to other users after verification." },
    { id: 5, question: "Can I delete my account?", answer: "Yes, go to Settings sidebar and click 'Delete Account'. This will permanently remove all your data and cannot be reversed." },
  ]);
  const [safetyTips] = useState([
    { title: "Never share personal info", description: "Don't share your address, phone number, or financial details until you trust someone." },
    { title: "Use video calls first", description: "Video call before meeting in person to verify the person matches their profile." },
    { title: "Tell a friend", description: "Always let someone know where you're meeting and when to expect your return." },
    { title: "Meet in public", description: "First meetings should always be in public places like cafes or restaurants." },
    { title: "Trust your instincts", description: "If something feels off, it probably is. Don't hesitate to block or report suspicious users." },
    { title: "Verify profiles", description: "Use the verification system to ensure profiles are authentic and real." },
  ]);

  // Current section
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const showAction = (message: string) => {
    setActionMessage(message);
    if (actionTimer.current) clearTimeout(actionTimer.current);
    actionTimer.current = window.setTimeout(() => setActionMessage(null), 2000);
  };

  // Fetch logged-in user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setLoggedInUser({
            name: userData.displayName || "User",
            displayName: userData.displayName || "User",
            avatar: userData.avatar || `/pic2datebukladies/${LADY_IMAGES[0]}`,
            email: userData.email || "user@example.com",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    if (accessToken) {
      fetchUser();
    }
  }, [accessToken]);

  // Load real persisted settings (notifications + profile visibility) on mount.
  const settingsHydrated = useRef(false);
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setPushNotifications(data.notifications?.push ?? true);
          setEmailNotifications(data.notifications?.email ?? true);
          setMessageNotifications(data.notifications?.messages ?? true);
          setProfileVisible(data.privacy?.profileVisible ?? true);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        settingsHydrated.current = true;
      }
    })();
  }, [accessToken]);

  // Persist notification/privacy toggles whenever they change (skipping the initial
  // hydration above so we don't immediately PATCH back the values we just fetched).
  useEffect(() => {
    if (!settingsHydrated.current || !accessToken) return;
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notifications: { push: pushNotifications, email: emailNotifications, messages: messageNotifications },
        privacy: { profileVisible },
      }),
    }).catch((error) => console.error("Failed to save settings:", error));
  }, [pushNotifications, emailNotifications, messageNotifications, profileVisible, accessToken]);

  const settingsCategories = useMemo(() => [
    {
      title: t(language, 'account_security'),
      icon: <Shield size={20} />,
      items: [
        { label: t(language, 'edit_profile'), action: () => setShowEditProfile(true) },
        { label: t(language, 'dating_preferences'), action: () => setShowDatingPreferences(true) },
        { label: t(language, 'password_2fa'), action: () => setShowTwoFactor(true) },
        { label: t(language, 'verification'), action: () => setShowVerification(true) },
      ],
    },
    {
      title: t(language, 'privacy_visibility'),
      icon: <Eye size={20} />,
      items: [
        { label: t(language, 'privacy_controls'), action: () => setShowPrivacySettings(true) },
        { label: t(language, 'photo_privacy'), action: () => setShowPhotoPrivacy(true) },
        { label: t(language, 'show_hide_profile'), action: () => setShowHideProfile(true) },
      ],
    },
    {
      title: t(language, 'notifications'),
      icon: <Bell size={20} />,
      items: [
        { label: t(language, 'push_notifications'), toggleable: true, state: pushNotifications, setState: setPushNotifications },
        { label: t(language, 'email_notifications'), toggleable: true, state: emailNotifications, setState: setEmailNotifications },
        { label: t(language, 'message_notifications'), toggleable: true, state: messageNotifications, setState: setMessageNotifications },
        { label: t(language, 'read_receipts'), toggleable: true, state: readReceipts, setState: setReadReceipts },
      ],
    },
    {
      title: t(language, 'matches_interactions'),
      icon: <Heart size={20} />,
      items: [
        { label: `${t(language, 'blocked_users')} (${blockedUsers})`, action: () => setShowBlockedUsers(true) },
        { label: t(language, 'match_history'), action: () => setShowMatchHistory(true) },
        { label: t(language, 'reported_users'), action: () => showAction(t(language, 'reported_list')) },
      ],
    },
    {
      title: t(language, 'subscription_payments'),
      icon: <CreditCard size={20} />,
      items: [
        { label: t(language, 'my_subscription'), action: () => setShowSubscription(true) },
        { label: t(language, 'billing_history'), action: () => setShowBillingHistory(true) },
        { label: t(language, 'payment_methods'), action: () => setShowPaymentMethods(true) },
      ],
    },
    {
      title: t(language, 'appearance_accessibility'),
      icon: <Moon size={20} />,
      items: [
        { label: t(language, 'dark_mode'), toggleable: true, state: darkMode, setState: setDarkMode },
        { label: t(language, 'language'), action: () => setShowLanguageSettings(true) },
        { label: t(language, 'text_size'), action: () => setShowTextSizeSettings(true) },
      ],
    },
    {
      title: t(language, 'help_support'),
      icon: <HelpCircle size={20} />,
      items: [
        { label: t(language, 'help_faq'), action: () => setShowHelpFAQ(true) },
        { label: t(language, 'contact_support'), action: () => setShowContactSupport(true) },
        { label: t(language, 'safety_tips'), action: () => setShowSafetyTips(true) },
        { label: t(language, 'about_terms'), action: () => setShowAboutTerms(true) },
      ],
    },
  ], [language, blockedUsers, pushNotifications, emailNotifications, messageNotifications, readReceipts, darkMode]);

  // Help & Support Modal Components
  const HelpFAQModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowHelpFAQ(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between border-b border-blue-700">
          <div>
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            <p className="text-blue-100 text-sm mt-1">Find answers to common questions</p>
          </div>
          <button
            onClick={() => setShowHelpFAQ(false)}
            aria-label="Close FAQ"
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FAQ List */}
        <div className="p-6 space-y-3">
          {faqs.map((faq) => (
            <motion.div
              key={faq.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              whileHover={{ borderColor: "#3b82f6" }}
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="font-semibold text-left text-slate-900 dark:text-white">{faq.question}</span>
                <motion.div
                  animate={{ rotate: expandedFAQ === faq.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                </motion.div>
              </button>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: expandedFAQ === faq.id ? "auto" : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-slate-200 dark:border-slate-700"
              >
                <p className="p-4 text-slate-600 dark:text-slate-300">{faq.answer}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  const ContactSupportModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowContactSupport(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between border-b border-blue-700">
          <div>
            <h2 className="text-2xl font-bold">Contact Support</h2>
            <p className="text-blue-100 text-sm mt-1">We're here to help</p>
          </div>
          <button
            onClick={() => setShowContactSupport(false)}
            aria-label="Close Support Form"
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Form */}
        <div className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={contactFormData.name}
            onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Your Email"
            value={contactFormData.email}
            onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Subject"
            value={contactFormData.subject}
            onChange={(e) => setContactFormData({ ...contactFormData, subject: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Your Message"
            value={contactFormData.message}
            onChange={(e) => setContactFormData({ ...contactFormData, message: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {/* Contact Methods */}
          <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Other ways to reach us:</h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p>📧 Email: support@dateapp.com</p>
              <p>💬 Live Chat: Available 9AM-9PM EST</p>
              <p>📱 Phone: +1-800-123-4567</p>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all">
            Send Message
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const SafetyTipsModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowSafetyTips(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-red-600 text-white p-6 flex items-center justify-between border-b border-amber-700">
          <div>
            <h2 className="text-2xl font-bold">Safety Tips</h2>
            <p className="text-amber-100 text-sm mt-1">Stay safe while dating online</p>
          </div>
          <button
            onClick={() => setShowSafetyTips(false)}
            aria-label="Close Safety Tips"
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Tips Grid */}
        <div className="p-6 grid md:grid-cols-2 gap-4">
          {safetyTips.map((tip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-amber-50 dark:bg-slate-700/50 border border-amber-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{tip.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{tip.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Emergency Info */}
        <div className="bg-red-50 dark:bg-slate-700/50 border-t border-red-200 dark:border-slate-600 p-6">
          <h3 className="font-semibold text-red-900 dark:text-red-400 mb-2">If you feel unsafe:</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">Contact local authorities or call: 1-800-799-7233 (National Domestic Violence Hotline)</p>
          <button className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
            Report Unsafe User
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const AboutTermsModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowAboutTerms(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-600 to-slate-800 text-white p-6 flex items-center justify-between border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold">About & Terms</h2>
            <p className="text-slate-300 text-sm mt-1">Learn more about our service</p>
          </div>
          <button
            onClick={() => setShowAboutTerms(false)}
            aria-label="Close About & Terms"
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">About Dating App</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              Dating App is a modern platform designed to help people find meaningful connections. We prioritize safety, security, and real user experiences.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <strong>Version:</strong> 4.1 | <strong>Last Updated:</strong> December 2024
            </p>
          </section>

          <hr className="border-slate-200 dark:border-slate-700" />

          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Terms of Service</h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p>• Users must be at least 18 years old to use this platform</p>
              <p>• You agree to use the service for lawful purposes only</p>
              <p>• Respectful interaction with other users is mandatory</p>
              <p>• We reserve the right to remove accounts that violate our guidelines</p>
              <p>• Full terms available at: www.dateapp.com/terms</p>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-700" />

          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Privacy Policy</h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p>• We protect your personal information with industry-standard security</p>
              <p>• Your data is never sold to third parties</p>
              <p>• You control what information is visible on your profile</p>
              <p>• Full privacy policy available at: www.dateapp.com/privacy</p>
            </div>
          </section>

          <button className="w-full bg-slate-600 text-white py-2 rounded-lg font-semibold hover:bg-slate-700 transition-colors">
            Read Full Terms Online
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  // Guard: Prevent rendering if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <MobileEnterpriseDrawer user={{ name: loggedInUser.displayName, avatar: loggedInUser.avatar }} />
      <EnterpriseSidebar user={{ name: loggedInUser.displayName, avatar: loggedInUser.avatar }} />

      <div className="flex-1 flex h-screen bg-gray-50">
      {/* Settings category sidebar */}
      <aside className="w-64 bg-white border-r border-pink-200 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-pink-200">
          <h2 className="text-2xl font-bold text-gray-900">{t(language, 'settings')}</h2>
          <p className="text-xs text-gray-500 mt-1">{t(language, 'manage_account')}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {settingsCategories.map((category, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSection(activeSection === category.title ? null : category.title)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeSection === category.title
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  : "text-gray-700 hover:bg-pink-50"
              }`}
            >
              {category.icon}
              <span className="text-sm font-medium">{category.title}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-pink-200 space-y-2">
          <Link href="/dashboard" className="block">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              <ArrowLeft size={16} />
              {t(language, 'back_to_matches')}
            </Button>
          </Link>
          <Button className="w-full bg-red-500 hover:bg-red-600 text-white" onClick={() => setShowDeleteAccount(true)}>
            <LogOut size={16} />
            {t(language, 'delete_account')}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* User Profile Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-white">
              <AvatarImage src={loggedInUser.avatar} alt={loggedInUser.name} />
              <AvatarFallback>{loggedInUser.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{loggedInUser.displayName}</h1>
              <p className="text-white/80">{loggedInUser.email}</p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-8">
          {activeSection ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {settingsCategories.find((c) => c.title === activeSection)?.title}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settingsCategories
                  .find((c) => c.title === activeSection)
                  ?.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-pink-200 p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{item.label}</span>
                        {item.toggleable ? (
                          <Switch
                            checked={item.state}
                            onCheckedChange={(checked) => {
                              item.setState?.(checked);
                              showAction(`${item.label} ${checked ? "enabled" : "disabled"}`);
                            }}
                          />
                        ) : (
                          <Button
                            size="sm"
                            className="bg-pink-500 hover:bg-pink-600"
                            onClick={item.action}
                          >
                            Manage
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <Settings size={64} className="mx-auto opacity-20 mb-4" />
              <p className="text-gray-500">{t(language, 'select_category')}</p>
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'edit_profile_title')}</h2>
              <button title="Close" onClick={() => setShowEditProfile(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'display_name')}</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t(language, 'display_name_placeholder')} className="bg-pink-50 border-pink-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t(language, 'bio_placeholder')}
                  className="w-full p-3 border border-pink-200 rounded-lg bg-pink-50 focus:outline-none focus:border-pink-400 resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'age')}</label>
                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder={t(language, 'age_placeholder')} className="bg-pink-50 border-pink-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'height')}</label>
                <select 
                  title="Select Height"
                  value={height} 
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full p-3 border border-pink-200 rounded-lg bg-pink-50 focus:outline-none focus:border-pink-400 text-gray-900"
                >
                  <option value="">Select Height</option>
                  <option value="4.67">4'8"</option>
                  <option value="4.83">4'10"</option>
                  <option value="5.00">5'0"</option>
                  <option value="5.17">5'2"</option>
                  <option value="5.33">5'4"</option>
                  <option value="5.50">5'6"</option>
                  <option value="5.67">5'8"</option>
                  <option value="5.83">5'10"</option>
                  <option value="6.00">6'0"</option>
                  <option value="6.17">6'2"</option>
                  <option value="6.33">6'4"</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'job_title')}</label>
                <select 
                  title="Select Job Title"
                  value={jobTitle} 
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (e.target.value !== "other") {
                      setCustomJobTitle("");
                    }
                  }}
                  className="w-full p-3 border border-pink-200 rounded-lg bg-pink-50 focus:outline-none focus:border-pink-400 text-gray-900"
                >
                  <option value="">Select Job Title</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="engineer">Engineer</option>
                  <option value="teacher">Teacher</option>
                  <option value="accountant">Accountant</option>
                  <option value="designer">Designer</option>
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                  <option value="entrepreneur">Entrepreneur</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="student">Student</option>
                  <option value="other">Other</option>
                </select>
                {jobTitle === "other" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3"
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">Please specify your job title *</label>
                    <Input 
                      placeholder="Enter your job title" 
                      value={customJobTitle} 
                      onChange={(e) => setCustomJobTitle(e.target.value)}
                      className="bg-pink-50 border-pink-200 border-2"
                      required
                    />
                    {!customJobTitle && jobTitle === "other" && (
                      <p className="text-xs text-red-600 mt-1">This field is required when "Other" is selected</p>
                    )}
                  </motion.div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'education')}</label>
                <select 
                  title="Select Education Level"
                  value={education} 
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full p-3 border border-pink-200 rounded-lg bg-pink-50 focus:outline-none focus:border-pink-400 text-gray-900"
                >
                  <option value="">Select Education Level</option>
                  <option value="high-school">High School</option>
                  <option value="associate">Associate's Degree</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
                  <option value="doctorate">Doctorate</option>
                  <option value="vocational">Vocational Training</option>
                </select>
              </div>

              <div className="pt-4 border-t border-pink-200">
                <Button
                  className={`w-full text-white ${jobTitle === "other" && !customJobTitle ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-pink-500 to-purple-600"}`}
                  onClick={() => {
                    if (jobTitle === "other" && !customJobTitle) {
                      showAction("Please enter a custom job title");
                      return;
                    }
                    showAction(t(language, 'profile_updated'));
                    setShowEditProfile(false);
                  }}
                  disabled={jobTitle === "other" && !customJobTitle}
                >
                  {t(language, 'save_changes')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacySettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'privacy_controls_title')}</h2>
              <button title="Close" onClick={() => setShowPrivacySettings(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <label className="text-sm font-medium text-gray-900 mb-3 block">{t(language, 'who_can_see')}</label>
                <div className="space-y-2">
                  {["public", "matches-only", "hidden"].map((mode) => (
                    <label key={mode} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        value={mode}
                        checked={privacyMode === mode}
                        onChange={(e) => {
                          setPrivacyMode(e.target.value as any);
                          showAction(`${t(language, 'privacy_controls')} ${t(language, 'enabled')}`);
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {t(language, mode === 'public' ? 'public' : mode === 'matches-only' ? 'matches_only' : 'hidden')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-pink-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{t(language, 'hide_age')}</span>
                <Switch checked={hideAge} onCheckedChange={setHideAge} />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-pink-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{t(language, 'hide_distance')}</span>
                <Switch checked={hideDistance} onCheckedChange={setHideDistance} />
              </div>

              <div className="pt-4 border-t border-pink-200">
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  onClick={() => {
                    showAction(t(language, 'privacy_saved'));
                    setShowPrivacySettings(false);
                  }}
                >
                  {t(language, 'save_settings')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      {showTwoFactor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'password_security_title')}</h2>
              <button title="Close" onClick={() => setShowTwoFactor(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">{t(language, 'two_factor_auth')}</p>
                <p className="text-xs text-blue-700">{t(language, 'two_factor_desc')}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-pink-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{t(language, 'enable_2fa')}</span>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    setTwoFactorEnabled(checked);
                    showAction(checked ? t(language, 'enabled') : t(language, 'disabled'));
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'current_password')}</label>
                <Input type="password" placeholder="••••••••" className="bg-pink-50 border-pink-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'new_password')}</label>
                <Input type="password" placeholder="••••••••" className="bg-pink-50 border-pink-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'confirm_password')}</label>
                <Input type="password" placeholder="••••••••" className="bg-pink-50 border-pink-200" />
              </div>

              <div className="pt-4 border-t border-pink-200">
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  onClick={() => {
                    showAction(t(language, 'security_updated'));
                    setShowTwoFactor(false);
                  }}
                >
                  {t(language, 'update_security')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Blocked Users Modal */}
      {showBlockedUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'blocked_users_title')} ({blockedUsers})</h2>
              <button title="Close" onClick={() => setShowBlockedUsers(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2">
              {["Sarah Johnson", "Mike Chen", "Emma Davis"].map((name, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
                  <span className="text-sm font-medium text-gray-900">{name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      setBlockedUsers(blockedUsers - 1);
                      showAction(`${name} ${t(language, 'unblocked')}`);
                    }}
                  >
                    {t(language, 'unblock')}
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-pink-200 mt-6">
              <Button
                className="w-full bg-gray-200 text-gray-900 hover:bg-gray-300"
                onClick={() => setShowBlockedUsers(false)}
              >
                {t(language, 'close')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-red-200 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-red-600">{t(language, 'delete_account_title')}</h2>
              <button title="Close" onClick={() => setShowDeleteAccount(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">{t(language, 'permanent_warning')}</p>
                  <p className="text-xs text-red-700 mt-1">{t(language, 'permanent_desc')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'confirm_email')}</label>
                <Input placeholder={loggedInUser.email} className="bg-red-50 border-red-200" />
              </div>

              <div className="pt-4 border-t border-pink-200 flex gap-3">
                <Button
                  className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
                  onClick={() => setShowDeleteAccount(false)}
                >
                  {t(language, 'cancel')}
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    showAction(t(language, 'delete_account_title'));
                    setShowDeleteAccount(false);
                  }}
                >
                  {t(language, 'delete_account')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dating Preferences Modal */}
      {showDatingPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'dating_preferences_title')}</h2>
              <button title="Close" onClick={() => setShowDatingPreferences(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t(language, 'age_range')} {agePreference.min} - {agePreference.max}</label>
                <div className="space-y-2">
                <label>{t(language, 'min_age')}</label>
                  <input type="range" min="18" max="100" value={agePreference.min} onChange={(e) => setAgePreference({...agePreference, min: Number(e.target.value)})} className="w-full" aria-label="Minimum age" />
                  <label>{t(language, 'max_age')}</label>
                  <input type="range" min="18" max="100" value={agePreference.max} onChange={(e) => setAgePreference({...agePreference, max: Number(e.target.value)})} className="w-full" aria-label="Maximum age" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t(language, 'distance')} {distancePreference} {t(language, 'km')}</label>
                <input type="range" min="1" max="500" value={distancePreference} onChange={(e) => setDistancePreference(Number(e.target.value))} className="w-full" aria-label={t(language, 'distance')} />
              </div>

              <div className="pt-4 border-t border-pink-200">
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  onClick={() => {
                    showAction(t(language, 'preferences_saved'));
                    setShowDatingPreferences(false);
                  }}
                >
                  {t(language, 'save_preferences')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'verification_title')}</h2>
              <button title="Close" onClick={() => setShowVerification(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{t(language, 'verification_status')}</p>
                <p className="text-xs text-blue-700 mt-2">
                  {t(language, 'current_level')} 
                  <span className="font-semibold uppercase ml-2 bg-blue-100 px-2 py-1 rounded">
                    {photoVerified || phoneVerified || emailVerified ? "Verified" : "Unverified"}
                  </span>
                </p>
                <div className="text-xs text-blue-600 mt-3 space-y-1">
                  <p>✓ {photoVerified ? "Photo Verified" : "Photo Not Verified"}</p>
                  <p>✓ {phoneVerified ? "Phone Verified" : "Phone Not Verified"}</p>
                  <p>✓ {emailVerified ? "Email Verified" : "Email Not Verified"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setPhotoVerified(!photoVerified);
                    showAction(photoVerified ? "Photo verification removed" : "Photo verified successfully!");
                  }}
                  className={`w-full p-3 border rounded-lg transition text-left ${photoVerified ? 'bg-green-50 border-green-300' : 'bg-white border-pink-200 hover:bg-pink-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{t(language, 'photo_verification')}</p>
                      <p className="text-xs text-gray-600">{t(language, 'photo_verification_desc')}</p>
                    </div>
                    {photoVerified && <span className="text-green-600 text-lg">✓</span>}
                  </div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setPhoneVerified(!phoneVerified);
                    showAction(phoneVerified ? "Phone verification removed" : "Phone verified successfully!");
                  }}
                  className={`w-full p-3 border rounded-lg transition text-left ${phoneVerified ? 'bg-green-50 border-green-300' : 'bg-white border-pink-200 hover:bg-pink-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{t(language, 'phone_verification')}</p>
                      <p className="text-xs text-gray-600">{t(language, 'phone_verification_desc')}</p>
                    </div>
                    {phoneVerified && <span className="text-green-600 text-lg">✓</span>}
                  </div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setEmailVerified(!emailVerified);
                    showAction(emailVerified ? "Email verification removed" : "Email verified successfully!");
                  }}
                  className={`w-full p-3 border rounded-lg transition text-left ${emailVerified ? 'bg-green-50 border-green-300' : 'bg-white border-pink-200 hover:bg-pink-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{t(language, 'email_verification')}</p>
                      <p className="text-xs text-gray-600">{t(language, 'email_verification_desc')}</p>
                    </div>
                    {emailVerified && <span className="text-green-600 text-lg">✓</span>}
                  </div>
                </motion.button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800"><strong>💡 Tip:</strong> Complete all verifications to increase your profile visibility and trustworthiness!</p>
              </div>

              <div className="pt-4 border-t border-pink-200">
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  onClick={() => {
                    setVerificationLevel(photoVerified && phoneVerified && emailVerified ? "verified" : "partially-verified");
                    showAction("Verification status updated!");
                    setShowVerification(false);
                  }}
                >
                  {t(language, 'save_changes')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Photo Privacy Modal */}
      {showPhotoPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'photo_privacy_title')}</h2>
              <button title="Close" onClick={() => setShowPhotoPrivacy(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-white border border-pink-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{t(language, 'hide_photos_profile')}</p>
                      <p className="text-xs text-gray-600">{t(language, 'only_show_matches')}</p>
                    </div>
                    <Switch checked={hidePhotosFromMatches} onCheckedChange={setHidePhotosFromMatches} />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">{t(language, 'privacy_tip')}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-pink-200">
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  onClick={() => {
                    showAction(t(language, 'privacy_saved'));
                    setShowPhotoPrivacy(false);
                  }}
                >
                  {t(language, 'save_settings')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Show/Hide Profile Modal */}
      {showHideProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'profile_visibility_title')}</h2>
              <button title="Close" onClick={() => setShowHideProfile(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{t(language, 'current_status')} <span className="font-bold text-pink-600">{profileVisible ? t(language, 'visible_status') : t(language, 'hidden_status')}</span></p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-pink-200 rounded-lg cursor-pointer hover:bg-pink-50">
                  <input 
                    type="radio" 
                    name="profile-visibility"
                    checked={profileVisible}
                    onChange={() => setProfileVisible(true)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{t(language, 'show_my_profile')}</p>
                    <p className="text-xs text-gray-600">{t(language, 'visible_all_users')}</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-pink-200 rounded-lg cursor-pointer hover:bg-pink-50">
                  <input 
                    type="radio"
                    name="profile-visibility"
                    checked={!profileVisible}
                    onChange={() => setProfileVisible(false)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{t(language, 'hide_my_profile')}</p>
                    <p className="text-xs text-gray-600">{t(language, 'visible_matches_only')}</p>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-pink-200">
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  onClick={() => {
                    showAction(profileVisible ? t(language, 'profile_shown') : t(language, 'profile_hidden'));
                    setShowHideProfile(false);
                  }}
                >
                  {t(language, 'update_visibility')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Match History Modal */}
      {showMatchHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'match_history_title')}</h2>
              <button title="Close" onClick={() => setShowMatchHistory(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2">
              {matchHistory.map((item, idx) => (
                <div key={idx} className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                  <p className="text-sm font-medium text-gray-900">{item}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-pink-200 mt-6">
              <Button
                className="w-full bg-gray-200 text-gray-900 hover:bg-gray-300"
                onClick={() => setShowMatchHistory(false)}
              >
                {t(language, 'close')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* My Subscription Modal */}
      {showSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'subscription_title')}</h2>
              <button title="Close" onClick={() => setShowSubscription(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg border border-pink-300">
                <p className="text-sm text-gray-600 mb-1">{t(language, 'current_plan')}</p>
                <p className="text-2xl font-bold text-pink-600 capitalize">{subscriptionPlan}</p>
                <p className="text-xs text-gray-600 mt-2">{t(language, 'expires')} April 12, 2026</p>
              </div>

              <div className="space-y-3">
                {["free", "premium", "elite"].map((plan) => (
                  <label key={plan} className="flex items-center gap-3 p-3 border border-pink-200 rounded-lg cursor-pointer hover:bg-pink-50">
                    <input 
                      type="radio"
                      name="subscription"
                      checked={subscriptionPlan === plan}
                      onChange={() => setSubscriptionPlan(plan)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-900 capitalize">{plan}</p>
                      <p className="text-xs text-gray-600">${plan === "free" ? "0.00" : plan === "premium" ? "14.99" : "29.99"}/month</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-pink-200">
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  onClick={() => {
                    showAction(t(language, 'subscription_updated'));
                    setShowSubscription(false);
                  }}
                >
                  {t(language, 'update_subscription')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Billing History Modal */}
      {showBillingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'billing_history_title')}</h2>
              <button title="Close" onClick={() => setShowBillingHistory(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2">
              {billingHistory.map((item, idx) => (
                <div key={idx} className="p-3 bg-pink-50 rounded-lg border border-pink-200 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{item}</p>
                  <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">{t(language, 'download')}</button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-pink-200 mt-6">
              <Button
                className="w-full bg-gray-200 text-gray-900 hover:bg-gray-300"
                onClick={() => setShowBillingHistory(false)}
              >
                {t(language, 'close')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {showPaymentMethods && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'payment_methods_title')}</h2>
              <button title="Close" onClick={() => { setShowPaymentMethods(false); setShowAddPaymentForm(false); }} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            {!showAddPaymentForm ? (
              <>
                <div className="space-y-3 mb-6">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id}
                      className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                        method.default 
                          ? 'bg-white border-pink-500' 
                          : 'bg-white border-pink-200 hover:bg-pink-50'
                      }`}
                      onClick={() => {
                        setDefaultPaymentId(method.id);
                        setPaymentMethods(paymentMethods.map(m => ({
                          ...m,
                          default: m.id === method.id
                        })));
                        showAction(`${method.type} ${t(language, 'default')}`);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900">💳 {method.type}</p>
                          <p className="text-xs text-gray-600">**** **** **** {method.last4}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.default && (
                            <span className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-1 rounded">
                              {t(language, 'default')}
                            </span>
                          )}
                          <button 
                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (paymentMethods.length > 1) {
                                const remainingMethods = paymentMethods.filter(m => m.id !== method.id);
                                setPaymentMethods(remainingMethods);
                                if (method.default && remainingMethods.length > 0) {
                                  remainingMethods[0].default = true;
                                  setDefaultPaymentId(remainingMethods[0].id);
                                }
                                showAction(`${method.type} ${t(language, 'remove')}`);
                              } else {
                                showAction(`${t(language, 'payment_saved')}`);
                              }
                            }}
                          >
                            {t(language, 'remove')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowAddPaymentForm(true)}
                  className="w-full p-3 border-2 border-dashed border-pink-300 rounded-lg hover:bg-pink-50 transition text-left mb-6"
                >
                  <p className="font-medium text-sm text-pink-600">{t(language, 'add_payment')}</p>
                </button>

                <div className="pt-4 border-t border-pink-200">
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    onClick={() => {
                      showAction(t(language, 'payment_saved'));
                      setShowPaymentMethods(false);
                    }}
                  >
                    {t(language, 'save_changes')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t(language, 'display_name')}</label>
                    <Input 
                      placeholder="John Doe" 
                      value={newCardData.cardholderName}
                      onChange={(e) => setNewCardData({...newCardData, cardholderName: e.target.value})}
                      className="bg-pink-50 border-pink-200" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <Input 
                      placeholder="4242 4242 4242 4242" 
                      value={newCardData.cardNumber}
                      onChange={(e) => setNewCardData({...newCardData, cardNumber: e.target.value})}
                      maxLength={19}
                      className="bg-pink-50 border-pink-200" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <Input 
                        placeholder="MM/YY" 
                        value={newCardData.expiryDate}
                        onChange={(e) => setNewCardData({...newCardData, expiryDate: e.target.value})}
                        maxLength={5}
                        className="bg-pink-50 border-pink-200" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <Input 
                        placeholder="123" 
                        value={newCardData.cvv}
                        onChange={(e) => setNewCardData({...newCardData, cvv: e.target.value})}
                        maxLength={3}
                        className="bg-pink-50 border-pink-200" 
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">💡 Your card details are securely encrypted and stored.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-pink-200 flex gap-3">
                  <Button
                    className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
                    onClick={() => {
                      setShowAddPaymentForm(false);
                      setNewCardData({ cardNumber: "", cardholderName: "", expiryDate: "", cvv: "" });
                    }}
                  >
                    {t(language, 'cancel')}
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    onClick={() => {
                      if (newCardData.cardNumber && newCardData.cardholderName && newCardData.expiryDate && newCardData.cvv) {
                        const last4 = newCardData.cardNumber.slice(-4);
                        const newMethod = {
                          id: Math.max(...paymentMethods.map(m => m.id), 0) + 1,
                          type: newCardData.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
                          last4: last4,
                          default: false
                        };
                        setPaymentMethods([...paymentMethods, newMethod]);
                        showAction(`Card ending in ${last4} added`);
                        setShowAddPaymentForm(false);
                        setNewCardData({ cardNumber: "", cardholderName: "", expiryDate: "", cvv: "" });
                      } else {
                        showAction("Please fill all fields");
                      }
                    }}
                  >
                    Add Card
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Language Settings Modal */}
      {showLanguageSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'language_title')}</h2>
              <button title="Close" onClick={() => setShowLanguageSettings(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2">
              {["en", "fr", "es", "de", "zh", "ja"].map((lang) => (
                <label key={lang} className="flex items-center gap-3 p-3 border border-pink-200 rounded-lg cursor-pointer hover:bg-pink-50">
                  <input 
                    type="radio"
                    name="language"
                    checked={language === lang}
                    onChange={() => setLanguage(lang)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {t(lang, lang === 'en' ? 'english' : lang === 'fr' ? 'french' : lang === 'es' ? 'spanish' : lang === 'de' ? 'german' : lang === 'zh' ? 'chinese' : 'japanese')}
                  </span>
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-pink-200 mt-6">
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                onClick={() => {
                  showAction(`${t(language, 'language_set')} ${language}`);
                  setShowLanguageSettings(false);
                }}
              >
                {t(language, 'save_language')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Text Size Settings Modal */}
      {showTextSizeSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-96 rounded-2xl bg-white p-6 border border-pink-200 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t(language, 'text_size_title')}</h2>
              <button title="Close" onClick={() => setShowTextSizeSettings(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {["small", "medium", "large", "extra-large"].map((size) => (
                <label key={size} className="flex items-center gap-4 p-4 border border-pink-200 rounded-lg cursor-pointer hover:bg-pink-50">
                  <input 
                    type="radio"
                    name="text-size"
                    checked={textSize === size}
                    onChange={() => setTextSize(size)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className={`font-medium text-gray-900 ${
                      size === "small" ? "text-sm" :
                      size === "medium" ? "text-base" :
                      size === "large" ? "text-lg" :
                      "text-xl"
                    }`}>
                      {t(language, size === 'small' ? 'small' : size === 'medium' ? 'medium' : size === 'large' ? 'large' : 'extra_large')} {t(language, 'text_size')}
                    </p>
                    <p className={`text-gray-600 ${
                      size === "small" ? "text-xs" :
                      size === "medium" ? "text-sm" :
                      size === "large" ? "text-base" :
                      "text-lg"
                    }`}>
                      {t(language, 'preview')}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-pink-200 mt-6">
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                onClick={() => {
                  showAction(`${t(language, 'text_size_set')} ${textSize}`);
                  setShowTextSizeSettings(false);
                }}
              >
                {t(language, 'save_text_size')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Action Message Toast */}
      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg shadow-lg"
        >
          {actionMessage}
        </motion.div>
      )}

      {/* Help & Support Modals */}
      <AnimatePresence>
        {showHelpFAQ && <HelpFAQModal />}
        {showContactSupport && <ContactSupportModal />}
        {showSafetyTips && <SafetyTipsModal />}
        {showAboutTerms && <AboutTermsModal />}
      </AnimatePresence>
      </div>
    </div>
  );
}
