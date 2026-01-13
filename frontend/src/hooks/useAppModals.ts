import { useState } from 'react';

export interface ToastState {
    message: string;
    subMessage?: string;
    emoji?: string;
}

export interface ScalingModalState {
    isOpen: boolean;
    habitId: string;
    habitName: string;
    failures: number;
    suggestion?: string;
}

export interface ChainModalState {
    isOpen: boolean;
    habitId: string;
}

export interface RehearsalState {
    anchor: string;
    tiny_behavior: string;
    celebration_method: string;
}

export const useAppModals = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Creation Modes
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);

    // Weekly Review
    const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
    const [weeklyBannerDismissed, setWeeklyBannerDismissed] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState<ToastState | null>(null);

    // Scaling suggestion modal state
    const [scalingModal, setScalingModal] = useState<ScalingModalState>({
        isOpen: false,
        habitId: '',
        habitName: '',
        failures: 0
    });

    // Chain setting modal state
    const [chainModal, setChainModal] = useState<ChainModalState>({
        isOpen: false,
        habitId: ''
    });

    // Rehearsal modal state
    const [rehearsalHabit, setRehearsalHabit] = useState<RehearsalState | null>(null);

    const closeAllCreators = () => {
        setIsCreatorOpen(false);
        setIsWizardOpen(false);
        setIsManualOpen(false);
    };

    return {
        // State
        isSettingsOpen, setIsSettingsOpen,
        isCreatorOpen, setIsCreatorOpen,
        isWizardOpen, setIsWizardOpen,
        isManualOpen, setIsManualOpen,
        isWeeklyReviewOpen, setIsWeeklyReviewOpen,
        weeklyBannerDismissed, setWeeklyBannerDismissed,
        toast, setToast,
        scalingModal, setScalingModal,
        chainModal, setChainModal,
        rehearsalHabit, setRehearsalHabit,
        // Helpers
        closeAllCreators
    };
};
