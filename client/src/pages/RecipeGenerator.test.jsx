import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import RecipeGenerator from './RecipeGenerator';
import api from '../services/api';

// Mock axios API client
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('RecipeGenerator Form Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <RecipeGenerator />
      </BrowserRouter>
    );
  };

  it('renders the empty recipe preview placeholder initially', () => {
    renderComponent();
    expect(screen.getByText('Your Recipe Preview')).toBeInTheDocument();
    expect(screen.getByText(/Enter your ingredients and preferences/i)).toBeInTheDocument();
  });

  it('allows adding ingredients to the list', async () => {
    renderComponent();
    
    const input = screen.getByPlaceholderText('e.g. eggs, spinach, onion');
    const addButton = screen.getAllByRole('button')[0]; // First button is plus for ingredients

    fireEvent.change(input, { target: { value: 'Avocado' } });
    fireEvent.click(addButton);

    // Verify ingredient pill is added
    expect(await screen.findByText('Avocado')).toBeInTheDocument();
  });

  it('allows adding allergies to the avoid list', async () => {
    renderComponent();

    const input = screen.getByPlaceholderText('e.g. peanuts, dairy, gluten');
    const addButton = screen.getAllByRole('button')[1]; // Second button is plus for allergies

    fireEvent.change(input, { target: { value: 'Peanuts' } });
    fireEvent.click(addButton);

    // Verify allergy pill is added
    expect(await screen.findByText('Peanuts')).toBeInTheDocument();
  });

  it('submits parameters and displays the generated recipe', async () => {
    const mockRecipe = {
      title: 'Protein Avocado Toast',
      servings: 1,
      nutrition: { calories: 350, protein: 12, carbs: 30, fats: 15 },
      ingredients: [{ name: 'Avocado', quantity: 1, unit: 'whole' }],
      steps: ['Mash avocado.', 'Toast bread.', 'Spread avocado on toast.'],
    };

    api.post.mockResolvedValueOnce({
      data: {
        data: {
          recipe: mockRecipe,
        },
      },
    });

    renderComponent();

    // 1) Add ingredient
    const ingInput = screen.getByPlaceholderText('e.g. eggs, spinach, onion');
    const addIngBtn = screen.getAllByRole('button')[0];
    fireEvent.change(ingInput, { target: { value: 'Bread' } });
    fireEvent.click(addIngBtn);

    // 2) Click Generate Recipe submit button
    const submitBtn = screen.getByRole('button', { name: /Generate Recipe/i });
    fireEvent.click(submitBtn);

    // 3) Verify API is called with correct params
    expect(api.post).toHaveBeenCalledWith('/recipes/generate', expect.objectContaining({
      ingredients: ['Bread'],
      dietGoal: 'maintenance',
      mealType: 'breakfast',
    }));

    // 4) Verify details rendered on UI
    expect(await screen.findByText('Protein Avocado Toast')).toBeInTheDocument();
    expect(await screen.findByText('12g')).toBeInTheDocument(); // Protein value
    expect(await screen.findByText('350 kcal')).toBeInTheDocument(); // Calories value
  });
});
