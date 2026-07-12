import React, { useState } from 'react'
import { DepartmentsTab } from '../components/DepartmentsTab'
import { CategoriesTab } from '../components/CategoriesTab'
import { EmployeesTab } from '../components/EmployeesTab'
import { motion } from 'framer-motion'

export const OrgSetup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'employees'>('departments')

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Organization Setup</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure departments, asset categories, and system user roles
        </p>
      </div>

      {/* Tabs list selector */}
      <div className="border-b border-border/60 flex space-x-6">
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'departments'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Asset Categories
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'employees'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Employee Directory
        </button>
      </div>

      {/* Active Tab Panel */}
      <div className="pt-2">
        {activeTab === 'departments' && <DepartmentsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'employees' && <EmployeesTab />}
      </div>
    </motion.div>
  )
}
