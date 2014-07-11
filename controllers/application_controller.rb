class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception. :exception
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :null_session
  before_filter :setup_info


  rescue_from CanCan::AccessDenied do |exception|
    redirect_to root_path, :alert => exception.message
  end


  def setup_info
    @title = 'BotProof — 3D Printer Model Repair'
  end
end
