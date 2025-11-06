import { RoleName } from '../roles';

export interface GreetingConfig {
  message: string;
  subtitle?: string;
}

/**
 * Get personalized greeting based on role, time of day, and user name
 */
export function getPersonalizedGreeting(
  firstName: string | null | undefined,
  hasRole: (role: string) => boolean
): GreetingConfig {
  const hour = new Date().getHours();
  let timeGreeting = '';
  
  // Determine time-based greeting
  if (hour >= 5 && hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeGreeting = 'Good evening';
  } else {
    timeGreeting = 'Good evening';
  }

  const name = firstName || 'there';
  const greeting = `${timeGreeting}, ${name}!`;

  // Role-based personalized messages
  if (hasRole(RoleName.SYSTEM_ADMIN)) {
    return {
      message: greeting,
      subtitle: 'You have full system access and administrative privileges.',
    };
  }

  if (hasRole(RoleName.HR_MANAGER)) {
    return {
      message: greeting,
      subtitle: 'Manage your workforce and oversee HR operations.',
    };
  }

  if (hasRole(RoleName.BRANCH_MANAGER)) {
    return {
      message: greeting,
      subtitle: 'Monitor your branch performance and team activities.',
    };
  }

  if (hasRole(RoleName.DEPARTMENT_HEAD)) {
    return {
      message: greeting,
      subtitle: 'Lead your department and track team progress.',
    };
  }

  // Default for regular employees
  return {
    message: greeting,
    subtitle: 'Welcome to your personal workspace.',
  };
}

