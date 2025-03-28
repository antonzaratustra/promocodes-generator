// Configuration for Google Sheets and their script IDs
module.exports = {
  sheets: [
    {
      name: 'MRWRU_DRWRU',
      scriptId: 'your_script_id_for_MRWRU_DRWRU_sheet',
      deploymentDescription: 'RestaurantWeek Moscow and Dubai RU'
    },
    {
      name: 'DRWEN',
      scriptId: 'your_script_id_for_DRWEN_sheet',
      deploymentDescription: 'RestaurantWeek Dubai EN'
    },
    {
      name: 'MSWRU_DSWRU',
      scriptId: 'your_script_id_for_MSWRU_DSWRU_sheet',
      deploymentDescription: 'SalonWeek Moscow and Dubai RU'
    },
    {
      name: 'DSWEN',
      scriptId: 'your_script_id_for_DSWEN_sheet',
      deploymentDescription: 'SalonWeek Dubai EN'
    }
  ]
};